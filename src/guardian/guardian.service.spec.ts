import { Test, TestingModule } from '@nestjs/testing';
import { GuardianService, Guardian } from './guardian.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

describe('GuardianService', () => {
  let service: GuardianService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockGuardian: Guardian = {
    guardian_id: 1,
    school_id: 1,
    guardian_code: 'GRD-26-00001',
    first_name_en: 'John',
    middle_name_en: null,
    last_name_en: 'Doe',
    first_name_np: 'जोन',
    middle_name_np: null,
    last_name_np: 'डोन',
    display_name: 'John Doe',
    relation_to_student: 'father',
    occupation: 'Business',
    education_level: 'Bachelor',
    mobile: '9841234567',
    alternate_mobile: '9841234568',
    email: 'john@example.com',
    annual_income: 500000,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardianService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<GuardianService>(GuardianService);
  });

  describe('create', () => {
    const createGuardianDto: CreateGuardianDto = {
      schoolId: 1,
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      relationToStudent: 'mother',
      mobile: '9841234567',
      occupation: 'Teacher',
    };

    it('should create a new guardian successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockGuardian,
        ...createGuardianDto,
      });

      const result = await service.create(createGuardianDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['9841234567', 1],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if mobile already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockGuardian);

      await expect(service.create(createGuardianDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate unique guardian code', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '5' }]);
      mockDatabaseService.insert.mockResolvedValue(mockGuardian);

      await service.create(createGuardianDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const guardianCode = insertCall[1][2];
      expect(guardianCode).toContain('GRD-26');
      expect(guardianCode).toContain('00006');
    });

    it('should set display name from Nepali names if provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockGuardian);

      const dtoWithNpNames: CreateGuardianDto = {
        ...createGuardianDto,
        firstNameNp: 'जेन',
        lastNameNp: 'स्मिथ',
      };

      await service.create(dtoWithNpNames);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const displayName = insertCall[1][9];
      expect(displayName).toBe('जेन स्मिथ');
    });

    it('should set display name from English names if Nepali not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockGuardian);

      await service.create(createGuardianDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const displayName = insertCall[1][9];
      expect(displayName).toBe('Jane Smith');
    });
  });

  describe('findAll', () => {
    it('should return all guardians for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockGuardian]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM guardians'),
        [1],
      );
    });

    it('should return empty array if no guardians', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return guardian by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockGuardian);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockGuardian);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE guardian_id = $1'),
        [1, 1],
      );
    });

    it('should return guardian by id without schoolId', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockGuardian);

      const result = await service.findOne(1);

      expect(result).toEqual(mockGuardian);
    });

    it('should throw NotFoundException if guardian not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateGuardianDto: UpdateGuardianDto = {
      firstNameEn: 'Updated',
      lastNameEn: 'Name',
      mobile: '9876543210',
    };

    it('should update guardian fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockGuardian)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockGuardian, ...updateGuardianDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateGuardianDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if guardian not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateGuardianDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockGuardian)
        .mockResolvedValueOnce(mockGuardian);

      await service.update(1, 1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete guardian', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockGuardian);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE guardians SET is_active = false'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if guardian not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByMobile', () => {
    it('should return guardian by mobile', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockGuardian);

      const result = await service.findByMobile('9841234567', 1);

      expect(result).toEqual(mockGuardian);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE mobile = $1'),
        ['9841234567', 1],
      );
    });

    it('should return null if guardian not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      const result = await service.findByMobile('0000000000', 1);

      expect(result).toBeNull();
    });
  });

  describe('searchGuardians', () => {
    it('should search guardians by name or mobile', async () => {
      mockDatabaseService.query.mockResolvedValue([mockGuardian]);

      const result = await service.searchGuardians(1, 'John');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(first_name_en) LIKE'),
        [1, '%john%'],
      );
    });

    it('should search in Nepali names too', async () => {
      mockDatabaseService.query.mockResolvedValue([mockGuardian]);

      await service.searchGuardians(1, 'जोन');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(first_name_np) LIKE'),
        [1, '%जोन%'],
      );
    });

    it('should search by mobile number', async () => {
      mockDatabaseService.query.mockResolvedValue([mockGuardian]);

      await service.searchGuardians(1, '9841234567');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('mobile LIKE'),
        [1, '%9841234567%'],
      );
    });

    it('should limit results to 50', async () => {
      mockDatabaseService.query.mockResolvedValue([mockGuardian]);

      await service.searchGuardians(1, 'test');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50'),
        expect.any(Array),
      );
    });
  });

  describe('getGuardianWithDetails', () => {
    it('should return guardian with details', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockGuardian);

      const result = await service.getGuardianWithDetails(1, 1);

      expect(result).toEqual(mockGuardian);
    });
  });
});
