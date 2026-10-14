import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from './exam.service';
import { DatabaseService } from '../database/database.service';
import { GradeService } from '../grade/grade.service';
import { NotFoundException } from '@nestjs/common';

describe('ExamService', () => {
  let service: ExamService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockExam = {
    exam_id: 1,
    school_id: 1,
    exam_name: 'First Terminal',
    exam_code: 'EXAM-001',
    exam_type: 'TERMINAL',
    class_id: 1,
    section_id: 1,
    subject_id: 1,
    exam_date: new Date('2024-05-01'),
    exam_date_bs: '2081-01-18',
    start_time: '09:00',
    end_time: '12:00',
    full_marks: 100,
    pass_marks: 35,
    is_published: false,
    is_active: true,
    is_result_published: false,
    is_locked: false,
    remarks: null,
    academic_year: '2081',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        {
          provide: GradeService,
          useValue: { create: jest.fn(), findAll: jest.fn() },
        },
      ],
    }).compile();
    service = module.get<ExamService>(ExamService);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 1,
      examName: 'Second Terminal',
      examCode: 'EXAM-002',
      examType: 'TERMINAL',
      classId: 1,
      subjectId: 1,
      examDate: new Date('2024-08-01'),
      fullMarks: 100,
      passMarks: 35,
    };

    it('should create a new exam successfully', async () => {
      mockDatabaseService.insert.mockResolvedValue({
        ...mockExam,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should include optional fields when provided', async () => {
      mockDatabaseService.insert.mockResolvedValue(mockExam);

      const dtoWithOptional = {
        ...createDto,
        examCode: 'EXAM-002',
        startTime: '10:00',
        endTime: '13:00',
        remarks: 'Annual exam',
      };

      await service.create(dtoWithOptional);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all exams for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockExam]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM exams'),
        [1],
      );
    });

    it('should filter by class', async () => {
      mockDatabaseService.query.mockResolvedValue([mockExam]);

      await service.findAll(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('class_id = $2'),
        [1, 1],
      );
    });

    it('should filter by exam type', async () => {
      mockDatabaseService.query.mockResolvedValue([mockExam]);

      await service.findAll(1, undefined, 'TERMINAL');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('exam_type = $2'),
        [1, 'TERMINAL'],
      );
    });

    it('should order by exam_date DESC', async () => {
      mockDatabaseService.query.mockResolvedValue([mockExam]);

      await service.findAll(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY exam_date DESC'),
        [1],
      );
    });
  });

  describe('findOne', () => {
    it('should return exam by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockExam);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockExam);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE exam_id = $1'),
        [1, 1],
      );
    });

    it('should return exam by id without schoolId', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockExam);

      const result = await service.findOne(1);

      expect(result).toEqual(mockExam);
    });

    it('should throw NotFoundException if exam not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      examName: 'Updated Exam',
      fullMarks: 50,
    };

    it('should update exam fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockExam)
        .mockResolvedValueOnce({ ...mockExam, ...updateDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if exam not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete exam', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockExam);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exams SET is_active = false'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if exam not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
