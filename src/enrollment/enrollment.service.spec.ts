import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentService, Enrollment } from './enrollment.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EnrollmentService', () => {
  let service: EnrollmentService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEnrollment: Enrollment = {
    enrollment_id: 1,
    school_id: 1,
    student_id: 1,
    class_id: 1,
    section_id: 1,
    academic_year: '2081',
    roll_number: 1,
    enrollment_date: new Date('2024-04-01'),
    enrollment_date_bs: '2081-01-01',
    is_current: true,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<EnrollmentService>(EnrollmentService);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 1,
      studentId: 1,
      classId: 1,
      academicYear: '2081',
      enrollmentDate: new Date('2024-04-01'),
    };

    it('should create a new enrollment successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ max_roll: '5' }]);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockEnrollment,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalled();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if student already has active enrollment', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockEnrollment);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should auto-generate roll number', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ max_roll: '5' }]);
      mockDatabaseService.insert.mockResolvedValue(mockEnrollment);

      await service.create(createDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return enrollments by school and academic year', async () => {
      mockDatabaseService.query.mockResolvedValue([mockEnrollment]);

      const result = await service.findAll(1, undefined, '2081');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM student_enrollments'),
        [1, '2081'],
      );
    });

    it('should return enrollments by student and academic year', async () => {
      mockDatabaseService.query.mockResolvedValue([mockEnrollment]);

      const result = await service.findAll(1, 1, '2081');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('student_id = $2'),
        [1, 1, '2081'],
      );
    });

    it('should order by roll_number ASC', async () => {
      mockDatabaseService.query.mockResolvedValue([mockEnrollment]);

      await service.findAll(1, undefined, '2081');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY roll_number ASC'),
        [1, '2081'],
      );
    });
  });

  describe('findOne', () => {
    it('should return enrollment by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockEnrollment);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockEnrollment);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE enrollment_id = $1'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      sectionId: 2,
    };

    it('should update enrollment fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockEnrollment)
        .mockResolvedValueOnce({ ...mockEnrollment, ...updateDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete enrollment', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockEnrollment);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE student_enrollments SET is_current = false',
        ),
        [1, 1],
      );
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
