import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { User } from '../user/entities/interfaces';

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

    if (!user) {
      this.logger.error('User not found: ' + username);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      this.logger.error('User not active: ' + username);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.locked_until) {
      // pg returns timestamps as strings — coerce before comparing, else
      // the lock check silently never fires.
      const lockedUntil = new Date(user.locked_until);
      if (!isNaN(lockedUntil.getTime()) && new Date() < lockedUntil) {
        const lockMinutes = Math.ceil(
          (lockedUntil.getTime() - new Date().getTime()) / 60000,
        );
        throw new UnauthorizedException(
          `Account locked for ${lockMinutes} more minutes`,
        );
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.userService.incrementFailedLogin(user.user_id);
      if ((user.failed_login_attempts ?? 0) >= 4) {
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
    try {
      const user = await this.validateUser(
        loginDto.username,
        loginDto.password,
      );
      this.logger.log('User validated: ' + user.username);

      // School context for this session: explicit schoolCode wins (for
      // users in multiple schools); otherwise the primary school.
      // Codes are non-enumerable unique text, unlike sequential ids.
      let loginSchoolId: number | null = user.school_id ?? null;
      if (loginDto.schoolCode) {
        const school = await this.db.queryOne<{
          school_id: number;
          status: string;
        }>(`SELECT school_id, status FROM schools WHERE school_code = $1`, [
          loginDto.schoolCode,
        ]);
        if (!school) {
          throw new BadRequestException(
            `Unknown school code '${loginDto.schoolCode}'`,
          );
        }
        if (school.status !== 'ACTIVE' && school.status !== 'TRIAL') {
          throw new ForbiddenException(
            'This school is not active. Contact support.',
          );
        }
        const membership = await this.db.queryOne(
          `SELECT 1 FROM school_members WHERE user_id = $1 AND school_id = $2 AND status = 'ACTIVE'`,
          [user.user_id, school.school_id],
        );
        if (!membership && !user.is_system) {
          throw new ForbiddenException('User does not belong to this school');
        }
        loginSchoolId = school.school_id;
      }

      const sessionId = crypto.randomUUID();

      const tokens = await this.getTokens(
        user.user_id,
        user.username,
        user.user_type ?? '',
        loginSchoolId,
        sessionId,
      );

      await this.db.query(
        `INSERT INTO user_sessions (session_id, user_id, school_id, refresh_token_hash, ip_address, user_agent, device_name, last_active_at, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + interval '7 days', NOW())`,
        [
          sessionId,
          user.user_id,
          loginSchoolId,
          sessionId,
          ip,
          userAgent,
          this.extractDevice(userAgent),
        ],
      );

      this.logger.log('Tokens generated for: ' + user.username);

      await this.userService.updateLastLoginInfo(user.user_id, ip, userAgent);

      return {
        ...tokens,
        sessionId,
        user: {
          id: user.user_id,
          schoolId: loginSchoolId,
          username: user.username,
          fullName: user.full_name,
          userType: user.user_type,
          email: user.email,
          phone: user.phone,
          isVerified: user.is_verified,
        },
      };
    } catch (error) {
      this.logger.error('Login error: ' + error.message);
      throw error;
    }
  }

  async logout(userId: number, refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      return;
    }

    const sessionId = payload.sid;

    await this.db.query(
      `DELETE FROM user_sessions WHERE user_id = $1 AND session_id = $2`,
      [userId, sessionId],
    );
  }

  async logoutAll(userId: number) {
    await this.db.query(`DELETE FROM user_sessions WHERE user_id = $1`, [
      userId,
    ]);

    const user = await this.userService.findOne(userId);
    if (user) {
      await this.db.insert(
        `INSERT INTO audit_logs (user_id, school_id, action, entity_type, new_value)
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
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
      });
    } catch (err) {
      this.logger.error(
        'Refresh token verification failed: ' + (err as Error).message,
      );
      throw new UnauthorizedException('Invalid session');
    }

    // The refresh token is only valid while its server-side session exists.
    const session = await this.db.queryOne<any>(
      `SELECT * FROM user_sessions WHERE session_id = $1 AND user_id = $2`,
      [payload.sid, payload.sub],
    );
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    if (
      session.expires_at &&
      new Date(session.expires_at).getTime() < Date.now()
    ) {
      await this.db.query(`DELETE FROM user_sessions WHERE session_id = $1`, [
        payload.sid,
      ]);
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userService.findOne(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User account inactive');
    }

    // Rotate: retire the old session row and persist the new one so logout
    // and logoutAll keep working after a refresh.
    const sessionId = crypto.randomUUID();

    const tokens = await this.getTokens(
      user.user_id,
      user.username,
      user.user_type ?? '',
      user.school_id ?? null,
      sessionId,
    );

    await this.db.query(`DELETE FROM user_sessions WHERE session_id = $1`, [
      payload.sid,
    ]);
    await this.db.query(
      `INSERT INTO user_sessions (session_id, user_id, school_id, refresh_token_hash, ip_address, user_agent, device_name, last_active_at, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + interval '7 days', NOW())`,
      [
        sessionId,
        user.user_id,
        user.school_id,
        sessionId,
        ip,
        userAgent,
        this.extractDevice(userAgent),
      ],
    );

    return {
      ...tokens,
      sessionId,
    };
  }

  async getTokens(
    userId: number,
    username: string,
    userType: string,
    schoolId: number | null,
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

  async register(createUserDto: any, adminSchoolId?: number) {
    const userData = {
      ...createUserDto,
      schoolId: adminSchoolId || createUserDto.schoolId,
    };
    const user = await this.userService.create(userData);
    return {
      message: 'User registered successfully. Account is active.',
      userId: user.user_id,
    };
  }

  async setupInitialAdmin(body: {
    schoolName: string;
    username: string;
    email: string;
    password: string;
    fullName: string;
    fullNameNp?: string;
    phone?: string;
  }) {
    this.logger.log('=== Starting setup ===');
    this.logger.log('School: ' + body.schoolName);
    this.logger.log('User: ' + body.username);

    try {
      // Check if tables exist
      const tables = await this.db.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('schools', 'users')
      `);

      this.logger.log('Found tables: ' + JSON.stringify(tables));

      if (tables.length < 2) {
        this.logger.error('Tables not created. Run migrations first.');
        throw new Error(
          'Database tables not initialized. Please contact admin.',
        );
      }

      // Check if admin exists
      const existingAdmins = await this.db.query(
        `SELECT user_id FROM users WHERE user_type = 'ADMIN' LIMIT 1`,
      );

      if (existingAdmins.length > 0) {
        throw new UnauthorizedException(
          'System already initialized. Please login.',
        );
      }

      // Create school
      this.logger.log('Creating school...');
      const schoolResult = await this.db.query(
        `INSERT INTO schools (name, is_active, created_at, updated_at)
         VALUES ($1, true, NOW(), NOW())
         RETURNING school_id, name`,
        [body.schoolName],
      );
      const schoolId = schoolResult[0].school_id;
      this.logger.log('School created: ' + schoolId);

      // Create admin user
      this.logger.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash(body.password, 10);

      const userResult = await this.db.query(
        `INSERT INTO users (username, email, password, password_hash, full_name, full_name_np, phone, user_type, school_id, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $3, $4, $5, $6, 'ADMIN', $7, true, true, NOW(), NOW())
         RETURNING user_id, username, email, user_type, school_id`,
        [
          body.username,
          body.email,
          hashedPassword,
          body.fullName,
          body.fullNameNp || null,
          body.phone || null,
          schoolId,
        ],
      );

      this.logger.log('Admin created: ' + userResult[0].user_id);

      return {
        message: 'System initialized successfully. Please login.',
        schoolId: schoolId,
        schoolName: body.schoolName,
        userId: userResult[0].user_id,
        username: userResult[0].username,
      };
    } catch (error) {
      this.logger.error('Setup error: ' + error.message);
      throw error;
    }
  }

  async getUserSchools(userId: number): Promise<
    Array<{
      school_id: number;
      school_code: string | null;
      name: string;
      status: string;
    }>
  > {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Platform super-admins operate across every active school.
    if ((user.user_type as string) === 'SUPER_ADMIN' || user.is_system) {
      return this.db.query(
        `SELECT school_id, school_code, name, status FROM schools WHERE status IN ('ACTIVE','TRIAL') ORDER BY school_id`,
      );
    }
    return this.db.query(
      `SELECT s.school_id, s.school_code, s.name, s.status
         FROM school_members m
         JOIN schools s ON s.school_id = m.school_id
        WHERE m.user_id = $1 AND m.status = 'ACTIVE' AND s.status IN ('ACTIVE','TRIAL')
        ORDER BY s.school_id`,
      [userId],
    );
  }

  async getUserProfile(userId: number) {
    const user = await this.userService.findOneWithSchool(userId);

    const school = user.school_id
      ? await this.db.queryOne<{ school_id: number; name: string }>(
          `SELECT school_id, name FROM schools WHERE school_id = $1`,
          [user.school_id],
        )
      : null;

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
      school,
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

  async forgotPassword(email: string) {
    const user = await this.userService.findByUsernameOrEmailOrPhone(email);

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await this.db.query(
      `UPDATE users SET reset_token = $2, reset_token_expiry = $3 WHERE user_id = $1`,
      [user.user_id, resetToken, resetTokenExpiry],
    );

    // The token travels via email/SMS — never echo it in the API response.
    return {
      message: 'If the email exists, a reset link will be sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.db.queryOne<any>(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token],
    );

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.db.query(
      `UPDATE users SET password = $2, password_hash = $2, reset_token = NULL, reset_token_expiry = NULL, is_verified = true, updated_at = NOW() WHERE user_id = $1`,
      [user.user_id, newPasswordHash],
    );

    return { message: 'Password reset successfully. You can now login.' };
  }
}
