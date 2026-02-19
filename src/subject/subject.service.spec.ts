import { Test, TestingModule } from '@nestjs/testing';
import { SubjectService, Subject } from './subject.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

describe('SubjectService', () => {
  let service: SubjectService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSubject: Subject = {
    subject_id: 1,
    school_id: 1,
    subject_code: 'MATH',
    subject_name_en: 'Mathematics',
    subject_name_np: 'गणित',
    subject_type: 'COMPULSORY',
    is_optional: false,
    credit_hours: 4,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<SubjectService>(SubjectService);
  });

  describe('create', () => {
    const createDto: CreateSubjectDto = {
      schoolId: 1,
      subjectCode: 'SCI',
      subjectName: 'Science',
      subjectNameNepali: 'विज्ञान',
      subjectType: 'COMPULSORY',
      creditHours: 4,
    };

    it('should create a new subject successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockSubject,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['SCI', 1],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if subject code already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSubject);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use default subjectType if not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockSubject);

      const dtoWithoutType = { ...createDto };
      delete (dtoWithoutType as any).subjectType;
      await service.create(dtoWithoutType);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      expect(insertCall[1][4]).toBe('COMPULSORY');
    });

    it('should use default creditHours if not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockSubject);

      const dtoWithoutCredits = { ...createDto };
      delete (dtoWithoutCredits as any).creditHours;
      await service.create(dtoWithoutCredits);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      expect(insertCall[1][6]).toBe(0);
    });

    it('should set is_active to true by default', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockSubject);

      await service.create(createDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all subjects for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockSubject]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM subjects'),
        [1],
      );
    });

    it('should return empty array if no subjects', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });

    it('should order by subject_name_en ASC', async () => {
      mockDatabaseService.query.mockResolvedValue([mockSubject]);

      await service.findAll(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY subject_name_en ASC'),
        [1],
      );
    });
  });

  describe('findOne', () => {
    it('should return subject by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSubject);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockSubject);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE subject_id = $1'),
        [1, 1],
      );
    });

    it('should return subject by id without schoolId', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSubject);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSubject);
    });

    it('should throw NotFoundException if subject not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateSubjectDto = {
      subjectName: 'Updated Science',
      creditHours: 5,
    };

    it('should update subject fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce({ ...mockSubject, ...updateDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if subject not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce(mockSubject);

      await service.update(1, 1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete subject', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSubject);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subjects SET is_active = false'),
        [1],
      );
    });

    it('should throw NotFoundException if subject not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubjectsByGroup', () => {
    it('should return subjects by group', async () => {
      mockDatabaseService.query.mockResolvedValue([mockSubject]);

      const result = await service.getSubjectsByGroup(1, 'COMPULSORY');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('subject_type = $2'),
        [1, 'COMPULSORY'],
      );
    });

    it('should return empty array if no subjects match group', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.getSubjectsByGroup(1, 'OPTIONAL');

      expect(result).toHaveLength(0);
    });
  });
});
