import { Test, TestingModule } from '@nestjs/testing';
import { AcademicClassService, AcademicClass } from './academic-class.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';

describe('AcademicClassService', () => {
  let service: AcademicClassService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockClass: AcademicClass = {
    class_id: 1,
    school_id: 1,
    class_name: 'Class 1',
    class_code: 'C1',
    class_order: 1,
    education_level: 'Primary',
    min_age: 5,
    max_age: 7,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicClassService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<AcademicClassService>(AcademicClassService);
  });

  describe('create', () => {
    const createDto: CreateAcademicClassDto = {
      schoolId: 1,
      className: 'Class 2',
      classCode: 'C2',
      classOrder: 2,
      educationLevel: 'Primary',
    };

    it('should create a new class successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockClass,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['C2', 1],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if class code already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockClass);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set default values for minAge and maxAge', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockClass);

      const dtoWithoutAges = { ...createDto };
      await service.create(dtoWithoutAges);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      expect(insertCall[1][5]).toBeNull();
      expect(insertCall[1][6]).toBeNull();
    });

    it('should set is_active to true by default', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockClass);

      await service.create(createDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all classes for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockClass]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM classes'),
        [1],
      );
    });

    it('should return empty array if no classes', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });

    it('should order by class_order ASC', async () => {
      mockDatabaseService.query.mockResolvedValue([mockClass]);

      await service.findAll(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY class_order ASC'),
        [1],
      );
    });
  });

  describe('findOne', () => {
    it('should return class by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockClass);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockClass);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE class_id = $1'),
        [1, 1],
      );
    });

    it('should return class by id without schoolId', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockClass);

      const result = await service.findOne(1);

      expect(result).toEqual(mockClass);
    });

    it('should throw NotFoundException if class not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAcademicClassDto = {
      className: 'Updated Class',
      classOrder: 5,
    };

    it('should update class fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce({ ...mockClass, ...updateDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if class not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(mockClass);

      await service.update(1, 1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete class', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockClass);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE classes SET is_active = false'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if class not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getClassesByLevel', () => {
    it('should return classes by education level', async () => {
      mockDatabaseService.query.mockResolvedValue([mockClass]);

      const result = await service.getClassesByLevel(1, 'Primary');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('education_level = $2'),
        [1, 'Primary'],
      );
    });

    it('should return empty array if no classes match level', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.getClassesByLevel(1, 'Secondary');

      expect(result).toHaveLength(0);
    });
  });

  describe('findBySchoolAndCode', () => {
    it('should return class by school and code', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockClass);

      const result = await service.findBySchoolAndCode(1, 'C1');

      expect(result).toEqual(mockClass);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('class_code = $2'),
        [1, 'C1'],
      );
    });

    it('should throw NotFoundException if class not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findBySchoolAndCode(1, 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
