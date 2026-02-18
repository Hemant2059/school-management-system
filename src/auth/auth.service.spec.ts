import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    findByUsernameOrEmailOrPhone: jest.fn(),
    findOne: jest.fn(),
    incrementFailedLogin: jest.fn(),
    lockAccount: jest.fn(),
    resetFailedLogins: jest.fn(),
    updateLastLoginInfo: jest.fn(),
    updatePassword: jest.fn(),
    create: jest.fn(),
    findOneWithSchool: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test_secret_key',
        JWT_EXPIRES_IN: '2h',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    const hashedPassword = bcrypt.hashSync('SecurePass123!', 10);
    const mockUser = {
      user_id: 1,
      email: 'admin@school.edu.np',
      username: 'admin',
      password_hash: hashedPassword,
      role: 'admin',
      school_id: 1,
      is_active: true,
      must_change_password: false,
      failed_login_attempts: 0,
      locked_until: null,
    };

    it('should validate user with correct password', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(mockUser);
      const result = await service.validateUser(
        'admin@school.edu.np',
        'SecurePass123!',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error for wrong password', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(mockUser);
      await expect(
        service.validateUser('admin@school.edu.np', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for non-existent user', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(null);
      await expect(
        service.validateUser('nonexistent@school.edu.np', 'SomePassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(
        inactiveUser,
      );
      await expect(
        service.validateUser('admin@school.edu.np', 'SecurePass123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        locked_until: new Date(Date.now() + 3600000),
      };
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(
        lockedUser,
      );
      await expect(
        service.validateUser('admin@school.edu.np', 'SecurePass123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should lock after 5 failed attempts', async () => {
      const userWithAttempts = { ...mockUser, failed_login_attempts: 4 };
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(
        userWithAttempts,
      );
      await expect(
        service.validateUser('admin@school.edu.np', 'WrongPassword'),
      ).rejects.toThrow('Account locked due to multiple failed attempts');
    });
  });

  describe('login', () => {
    const hashedPassword = bcrypt.hashSync('SecurePass123!', 10);
    const mockUser = {
      user_id: 1,
      email: 'admin@school.edu.np',
      username: 'admin',
      password_hash: hashedPassword,
      user_type: 'admin',
      school_id: 1,
      is_active: true,
    };

    it('should login successfully', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(mockUser);
      mockUserService.resetFailedLogins.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('access_token');
      mockDatabaseService.insert.mockResolvedValue([
        { session_id: 'session_1' },
      ]);

      const result = await service.login(
        { username: 'admin@school.edu.np', password: 'SecurePass123!' },
        '127.0.0.1',
        'Chrome',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('register', () => {
    const createUserDto = {
      email: 'newuser@school.edu.np',
      username: 'newuser',
      password: 'Pass123456',
      role: 'teacher',
      schoolId: 1,
    };

    it('should register new user', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({ user_id: 2 });
      const result = await service.register(createUserDto);
      expect(result).toHaveProperty('message');
    });
  });

  describe('changePassword', () => {
    const hashedPassword = bcrypt.hashSync('oldpassword', 10);

    it('should change password', async () => {
      mockUserService.findOne.mockResolvedValue({
        user_id: 1,
        password_hash: hashedPassword,
      });
      mockUserService.updatePassword.mockResolvedValue(undefined);
      await expect(
        service.changePassword(1, 'oldpassword', 'newpassword123'),
      ).resolves.not.toThrow();
    });

    it('should throw for non-existent user', async () => {
      mockUserService.findOne.mockResolvedValue(null);
      await expect(service.changePassword(999, 'old', 'new')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid session', async () => {
      const mockPayload = {
        sub: 1,
        username: 'admin',
        sid: 'session_1',
        schoolId: 1,
      };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockDatabaseService.queryOne.mockResolvedValue({
        session_id: 'session_1',
        expires_at: new Date(Date.now() + 86400000),
      });
      mockUserService.findOne.mockResolvedValue({
        user_id: 1,
        username: 'admin',
        user_type: 'admin',
        school_id: 1,
        is_active: true,
      });
      mockJwtService.signAsync.mockResolvedValue('new_token');

      const result = await service.refreshTokens(
        'old_token',
        '127.0.0.1',
        'Chrome',
      );
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw for invalid session', async () => {
      const mockPayload = { sub: 1, sid: 'invalid' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(
        service.refreshTokens('token', '127.0.0.1', 'Chrome'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should return message for existing email', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue({
        user_id: 1,
      });
      mockDatabaseService.update.mockResolvedValue(undefined);
      const result = await service.forgotPassword('test@school.edu.np');
      expect(result).toHaveProperty('message');
    });

    it('should return message even for non-existent (security)', async () => {
      mockUserService.findByUsernameOrEmailOrPhone.mockResolvedValue(null);
      const result = await service.forgotPassword('nonexistent@school.edu.np');
      expect(result).toHaveProperty('message');
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      mockDatabaseService.update.mockResolvedValue(undefined);
      await expect(service.logout(1, 'token')).resolves.not.toThrow();
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices', async () => {
      mockDatabaseService.update.mockResolvedValue(undefined);
      await expect(service.logoutAll(1)).resolves.not.toThrow();
    });
  });
});
