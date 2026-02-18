import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { UserSession } from '../user/entities/user-session.entity';
import { User } from '../user/entities/user.entity';
import { AuditLog } from '../user/entities/audit-log.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userService.findByUsernameOrEmailOrPhone(username);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const lockMinutes = Math.ceil(
        (user.lockedUntil.getTime() - new Date().getTime()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked for ${lockMinutes} more minutes`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.userService.incrementFailedLogin(user.userId);
      if (user.failedLoginAttempts >= 4) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.userService.lockAccount(user.userId, lockUntil);
        throw new UnauthorizedException(
          'Account locked due to multiple failed attempts. Try again in 15 minutes.',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userService.resetFailedLogins(user.userId);
    return user;
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    // 1. Create session object first to get UUID
    const session = this.sessionRepository.create({
      userId: user.userId,
      schoolId: user.schoolId,
      refreshTokenHash: 'PENDING', // Temporary placeholder
      ipAddress: ip,
      userAgent,
      deviceName: this.extractDevice(userAgent),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Save to generate sessionId
    await this.sessionRepository.save(session);

    // 2. Generate tokens including the sid and schoolId
    const tokens = await this.getTokens(
      user.userId,
      user.username,
      user.userType,
      user.schoolId,
      session.sessionId,
    );

    // 3. Update session with actual refresh token hash
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');

    session.refreshTokenHash = refreshTokenHash;
    await this.sessionRepository.save(session);

    // Update user's last login tracking
    await this.userService.updateLastLoginInfo(user.userId, ip, userAgent);

    // Record login in audit log
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        userId: user.userId,
        schoolId: user.schoolId,
        action: 'LOGIN',
        module: 'AUTH',
        ipAddress: ip,
        userAgent,
        details: { sessionId: session.sessionId },
      }),
    );

    return {
      ...tokens,
      sessionId: session.sessionId,
      user: {
        id: user.userId,
        schoolId: user.schoolId,
        username: user.username,
        fullName: user.fullName,
        userType: user.userType,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  async logout(userId: number, refreshToken: string) {
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.sessionRepository.delete({ userId, refreshTokenHash });
  }

  async logoutAll(userId: number) {
    await this.sessionRepository.delete({ userId });

    // Record in audit log
    const user = await this.userService.findOne(userId);
    await this.auditLogRepository.save(
      this.auditLogRepository.create({
        userId,
        schoolId: user.schoolId,
        action: 'LOGOUT_ALL',
        module: 'AUTH',
        details: { message: 'Signed out from all devices' },
      }),
    );
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

    const session = await this.sessionRepository.findOne({
      where: { userId: payload.sub, refreshTokenHash },
    });

    if (!session || new Date() > session.expiresAt) {
      if (session) await this.sessionRepository.remove(session);
      throw new UnauthorizedException('Session expired or invalidated');
    }

    const user = await this.userService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account inactive');
    }

    const tokens = await this.getTokens(
      user.userId,
      user.username,
      user.userType,
      user.schoolId,
      session.sessionId,
    );

    // Update session with new refresh token
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastActiveAt = new Date();
    session.ipAddress = ip;
    session.userAgent = userAgent;
    await this.sessionRepository.save(session);

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
      message: 'User registered successfully. Please verify your account.',
      userId: user.userId,
    };
  }

  async getUserProfile(userId: number) {
    const user = await this.userService.findOneWithSchool(userId);

    return {
      userId: user.userId,
      schoolId: user.schoolId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      userType: user.userType,
      isVerified: user.isVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      school: user.school
        ? {
            schoolId: user.school.schoolId,
            schoolCode: user.school.schoolCode,
            schoolName: user.school.schoolName,
            schoolNameNepali: user.school.schoolNameNepali,
          }
        : null,
    };
  }
}
