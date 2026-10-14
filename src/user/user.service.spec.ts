import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Order, PageOptionsDto } from '../common/dto/page-options.dto';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = {
    userId: 1,
    schoolId: 1,
    username: 'testuser',
    email: 'test@example.com',
    phone: '9841234567',
    passwordHash: 'hashedpassword',
    fullName: 'Test User',
    userType: 'teacher',
    isVerified: false,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastLoginIp: null,
    lastLoginAgent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    const createUserDto = {
      schoolId: 1,
      username: 'newuser',
      email: 'new@example.com',
      phone: '9841234567',
      password: 'password123',
      fullName: 'New User',
      userType: 'teacher',
    };

    it('should create a new user successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['newuser', 'new@example.com', '9841234567'],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if username already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        'User with this username/email/phone already exists',
      );
    });

    it('should hash password before saving', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockUser);

      await service.create(createUserDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const passwordHash = insertCall[1][4];
      expect(passwordHash).not.toBe('password123');
      expect(bcrypt.compareSync('password123', passwordHash)).toBe(true);
    });
  });

  describe('findAll', () => {
    const pageOptionsDto = {
      page: 1,
      take: 10,
      order: Order.DESC,
    } as unknown as PageOptionsDto;

    it('should return paginated users', async () => {
      mockDatabaseService.query.mockResolvedValue([mockUser]);
      mockDatabaseService.query
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await service.findAll(pageOptionsDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
      expect(result.meta.itemCount).toBe(1);
    });

    it('should use default pagination values', async () => {
      mockDatabaseService.query.mockResolvedValue([mockUser]);
      mockDatabaseService.query
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.findAll(pageOptionsDto);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [10, 0],
      );
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [1],
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should delegate to findById', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsernameOrEmailOrPhone', () => {
    it('should find user by username', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);

      const result = await service.findByUsernameOrEmailOrPhone('testuser');

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('username = $1 OR email = $1 OR phone = $1'),
        ['testuser'],
      );
    });

    it('should find user by email', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);

      const result =
        await service.findByUsernameOrEmailOrPhone('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      const result = await service.findByUsernameOrEmailOrPhone('notfound');

      expect(result).toBeNull();
    });
  });

  describe('incrementFailedLogin', () => {
    it('should increment failed login attempts', async () => {
      mockDatabaseService.query.mockResolvedValue(null);

      await service.incrementFailedLogin(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE users SET failed_login_attempts = failed_login_attempts + 1',
        ),
        [1],
      );
    });
  });

  describe('resetFailedLogins', () => {
    it('should reset failed login attempts and unlock account', async () => {
      mockDatabaseService.query.mockResolvedValue(null);

      await service.resetFailedLogins(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET failed_login_attempts = 0'),
        [1],
      );
    });
  });

  describe('lockAccount', () => {
    it('should lock account until specified time', async () => {
      mockDatabaseService.query.mockResolvedValue(null);
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);

      await service.lockAccount(1, lockUntil);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET locked_until = $2'),
        [1, lockUntil],
      );
    });
  });

  describe('updateLastLoginInfo', () => {
    it('should update last login info', async () => {
      mockDatabaseService.query.mockResolvedValue(null);

      await service.updateLastLoginInfo(1, '192.168.1.1', 'Mozilla/5.0');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET last_login_at = NOW()'),
        [1, '192.168.1.1'],
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', async () => {
      mockDatabaseService.query.mockResolvedValue(null);
      const newHash = 'newhashedpassword';

      await service.updatePassword(1, newHash);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password_hash = $2'),
        [1, newHash],
      );
    });
  });

  describe('update', () => {
    const updateUserDto = {
      email: 'updated@example.com',
      fullName: 'Updated Name',
    };

    it('should update user fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, ...updateUserDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, updateUserDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should hash password when updating password', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.update(1, { password: 'newpassword' });

      const queryCall = mockDatabaseService.query.mock.calls[0];
      const passwordHash = queryCall[1].find(
        (p: string) => p.includes('$2') || p.startsWith('$'),
      );
      expect(passwordHash).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockUser);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET is_active = false'),
        [1],
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
