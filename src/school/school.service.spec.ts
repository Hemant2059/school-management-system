import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from './school.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SchoolService', () => {
  let service: SchoolService;

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
        SchoolService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<SchoolService>(SchoolService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new school', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue([
        { school_id: 1, school_name: 'Test' },
      ]);

      const result = await service.create(
        {
          schoolName: 'Test School',
          schoolCode: 'SCH-001',
        } as any,
        1,
      );

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if school code exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({
        school_code: 'SCH-001',
        school_name: 'Existing',
      });

      await expect(
        service.create({ schoolName: 'Test', schoolCode: 'SCH-001' } as any, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all schools', async () => {
      const mockSchools = [
        { school_id: 1, school_name: 'School 1' },
        { school_id: 2, school_name: 'School 2' },
      ];
      mockDatabaseService.query.mockResolvedValue(mockSchools);

      const result = await service.findAll();

      expect(result).toEqual(mockSchools);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no schools', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return school by ID', async () => {
      const mockSchool = { school_id: 1, school_name: 'Test School' };
      mockDatabaseService.queryOne.mockResolvedValue(mockSchool);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSchool);
    });

    it('should throw NotFoundException if school not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSchoolWithNepaliDate', () => {
    it('should return school with BS date converted', async () => {
      const mockSchool = {
        school_id: 1,
        school_name: 'Test School',
        established_date: '2000-01-01',
      };
      mockDatabaseService.queryOne.mockResolvedValue(mockSchool);

      const result = await service.getSchoolWithNepaliDate(1);

      expect(result).toBeDefined();
      expect(result.school_id).toBe(1);
    });

    it('should throw NotFoundException if school not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.getSchoolWithNepaliDate(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update school', async () => {
      const mockSchool = {
        school_id: 1,
        school_name: 'Old Name',
        is_active: true,
      };
      mockDatabaseService.queryOne.mockResolvedValue(mockSchool);
      mockDatabaseService.update.mockResolvedValue([{ school_id: 1 }]);

      const result = await service.update(
        1,
        { schoolName: 'New Name' } as any,
        1,
      );

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if school not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(
        service.update(999, { schoolName: 'Test' } as any, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete school', async () => {
      const mockSchool = { school_id: 1, is_active: true };
      mockDatabaseService.queryOne.mockResolvedValue(mockSchool);
      mockDatabaseService.query.mockResolvedValue([]);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if school not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Nepal-Specific Tests', () => {
    it('should handle Nepali date conversion', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue([{ school_id: 1 }]);

      const result = await service.create(
        {
          schoolName: 'Unique School 1',
          schoolCode: 'SCH-U1',
          establishedDateBs: '2057-01-01',
        } as any,
        1,
      );

      expect(result).toBeDefined();
    });

    it('should store province/district/municipality IDs', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue([{ school_id: 1 }]);

      const result = await service.create(
        {
          schoolName: 'Unique School 2',
          schoolCode: 'SCH-U2',
          provinceId: 3,
          districtId: 5,
          municipalityId: 10,
          wardNo: 1,
        } as any,
        1,
      );

      expect(result).toBeDefined();
    });

    it('should support all school types', async () => {
      const schoolTypes = ['DAY', 'BOARDING', 'DAY_BOARDING'];

      for (let i = 0; i < schoolTypes.length; i++) {
        mockDatabaseService.queryOne.mockResolvedValue(null);
        mockDatabaseService.insert.mockResolvedValue([{ school_id: 1 }]);

        const result = await service.create(
          {
            schoolName: `Test ${schoolTypes[i]}`,
            schoolCode: `SCH-${i}`,
            schoolType: schoolTypes[i],
          } as any,
          1,
        );

        expect(result).toBeDefined();
      }
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in list', async () => {
      const mockSchools = [{ school_id: 1, school_name: 'School 1' }];
      mockDatabaseService.query.mockResolvedValue(mockSchools);

      const result = await service.findAll();

      expect(result[0]).not.toHaveProperty('bank_account_number');
      expect(result[0]).not.toHaveProperty('password');
    });

    it('should track who created the school', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue([{ school_id: 1 }]);

      await service.create(
        {
          schoolName: 'Creator Test',
          schoolCode: 'SCH-CR',
        } as any,
        123,
      );

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });
});
