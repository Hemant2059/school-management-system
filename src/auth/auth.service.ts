import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { User, UserSession } from '../user/entities/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private db: DatabaseService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userService.findByUsernameOrEmailOrPhone(username);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.locked_until && new Date() < user.locked_until) {
      const lockMinutes = Math.ceil(
        (user.locked_until.getTime() - new Date().getTime()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked for ${lockMinutes} more minutes`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.userService.incrementFailedLogin(user.user_id);
      if (user.failed_login_attempts >= 4) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.userService.lockAccount(user.user_id, lockUntil);
        throw new UnauthorizedException(
          'Account locked due to multiple failed attempts. Try again in 15 minutes.',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userService.resetFailedLogins(user.user_id);
    return user;
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    const sessionId = crypto.randomUUID();
    const refreshTokenHash = 'PENDING';

    await this.db.insert(
      `INSERT INTO user_sessions (session_id, user_id, school_id, refresh_token_hash, ip_address, user_agent, device_name, last_active_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '7 days')
       RETURNING *`,
      [
        sessionId,
        user.user_id,
        user.school_id,
        refreshTokenHash,
        ip,
        userAgent,
        this.extractDevice(userAgent),
      ],
    );

    const tokens = await this.getTokens(
      user.user_id,
      user.username,
      user.user_type,
      user.school_id,
      sessionId,
    );

    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');

    await this.db.query(
      `UPDATE user_sessions SET refresh_token_hash = $2, updated_at = NOW() WHERE session_id = $1`,
      [sessionId, newRefreshTokenHash],
    );

    await this.userService.updateLastLoginInfo(user.user_id, ip, userAgent);

    await this.db.insert(
      `INSERT INTO audit_logs (user_id, school_id, action, entity_type, new_values, ip_address, user_agent)
       VALUES ($1, $2, 'LOGIN', 'USER', $3, $4, $5)`,
      [
        user.user_id,
        user.school_id,
        JSON.stringify({ sessionId }),
        ip,
        userAgent,
      ],
    );

    return {
      ...tokens,
      sessionId,
      user: {
        id: user.user_id,
        schoolId: user.school_id,
        username: user.username,
        fullName: user.full_name,
        userType: user.user_type,
        email: user.email,
        phone: user.phone,
        isVerified: user.is_verified,
      },
    };
  }

  async logout(userId: number, refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.db.query(
      `DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token_hash = $2`,
      [userId, refreshTokenHash],
    );
  }

  async logoutAll(userId: number) {
    await this.db.query(`DELETE FROM user_sessions WHERE user_id = $1`, [
      userId,
    ]);

    const user = await this.userService.findOne(userId);
    if (user) {
      await this.db.insert(
        `INSERT INTO audit_logs (user_id, school_id, action, module, details)
         VALUES ($1, $2, 'LOGOUT_ALL', 'AUTH', $3)`,
        [
          userId,
          user.school_id,
          JSON.stringify({ message: 'Signed out from all devices' }),
        ],
      );
    }
  }

  async refreshTokens(refreshToken: string, ip: string, userAgent: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid session');
    }

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const session = await this.db.queryOne<UserSession>(
      `SELECT * FROM user_sessions WHERE user_id = $1 AND refresh_token_hash = $2`,
      [payload.sub, refreshTokenHash],
    );

    if (!session || new Date() > session.expires_at) {
      if (session) {
        await this.db.query(`DELETE FROM user_sessions WHERE session_id = $1`, [
          session.session_id,
        ]);
      }
      throw new UnauthorizedException('Session expired or invalidated');
    }

    const user = await this.userService.findOne(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User account inactive');
    }

    const tokens = await this.getTokens(
      user.user_id,
      user.username,
      user.user_type,
      user.school_id,
      session.session_id,
    );

    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');

    await this.db.query(
      `UPDATE user_sessions SET refresh_token_hash = $2, last_active_at = NOW(), ip_address = $3, user_agent = $4, updated_at = NOW() WHERE session_id = $1`,
      [session.session_id, newRefreshTokenHash, ip, userAgent],
    );

    return tokens;
  }

  async getTokens(
    userId: number,
    username: string,
    userType: string,
    schoolId: number,
    sid?: string,
  ) {
    const payload = {
      sub: userId,
      username,
      userType,
      schoolId,
      sid,
      nepaliDate: NepaliDateUtil.today().bsDate,
      jti: crypto.randomBytes(16).toString('hex'),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '2h',
        ) as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private extractDevice(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('Mobi')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Postman')) return 'Postman';
    return 'Desktop/Web';
  }

  async register(createUserDto: any) {
    const user = await this.userService.create(createUserDto);
    return {
      message: 'User registered successfully. Account is active.',
      userId: user.user_id,
    };
  }

  async getUserProfile(userId: number) {
    const user = await this.userService.findOneWithSchool(userId);

    return {
      userId: user.user_id,
      schoolId: user.school_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      userType: user.user_type,
      isVerified: user.is_verified,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      lastLoginIp: user.last_login_ip,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      school: null,
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.userService.updatePassword(userId, newPasswordHash);

    await this.db.query(
      `UPDATE users SET is_verified = true, updated_at = NOW() WHERE user_id = $1`,
      [userId],
    );

    return { message: 'Password changed successfully. Account verified.' };
  }
}
