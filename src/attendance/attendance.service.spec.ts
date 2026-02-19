import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService, Attendance } from './attendance.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockAttendance: Attendance = {
    attendance_id: 1,
    school_id: 1,
    student_id: 1,
    class_id: 1,
    section_id: 1,
    academic_year: '2081',
    attendance_date: new Date('2024-05-01'),
    attendance_date_bs: '2081-01-18',
    status: 'PRESENT',
    session: 'MORNING',
    remarks: null,
    check_in_time: '08:00',
    check_out_time: '14:00',
    biometric_device_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    created_by: 1,
    updated_by: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('create', () => {
    const createDto = {
      schoolId: 1,
      studentId: 1,
      classId: 1,
      academicYear: '2081',
      attendanceDate: new Date('2024-05-02'),
      status: 'PRESENT',
    };

    it('should create a new attendance record successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockAttendance,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalled();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if attendance already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockAttendance);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include optional fields when provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockAttendance);

      const dtoWithOptional = {
        ...createDto,
        classId: 1,
        sectionId: 1,
        remarks: 'Late arrival',
      };

      await service.create(dtoWithOptional);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('createBulk', () => {
    it('should create multiple attendance records', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockAttendance);

      const bulkDto = {
        records: [
          {
            schoolId: 1,
            studentId: 1,
            academicYear: '2081',
            attendanceDate: new Date(),
            status: 'PRESENT',
          },
          {
            schoolId: 1,
            studentId: 2,
            academicYear: '2081',
            attendanceDate: new Date(),
            status: 'PRESENT',
          },
        ],
      };

      const result = await service.createBulk(bulkDto);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should skip duplicate records', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockAttendance);
      mockDatabaseService.insert.mockResolvedValue(mockAttendance);

      const bulkDto = {
        records: [
          {
            schoolId: 1,
            studentId: 1,
            academicYear: '2081',
            attendanceDate: new Date(),
            status: 'PRESENT',
          },
          {
            schoolId: 1,
            studentId: 2,
            academicYear: '2081',
            attendanceDate: new Date(),
            status: 'PRESENT',
          },
        ],
      };

      const result = await service.createBulk(bulkDto);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findAll', () => {
    it('should return attendance records for a school and academic year', async () => {
      mockDatabaseService.query.mockResolvedValue([mockAttendance]);

      const result = await service.findAll(1, { academicYear: '2081' });

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM attendance_records'),
        [1, '2081'],
      );
    });

    it('should return empty array if no academic year provided', async () => {
      const result = await service.findAll(1, {});

      expect(result).toEqual([]);
      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return attendance by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockAttendance);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockAttendance);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE attendance_id = $1'),
        [1, 1],
      );
    });

    it('should return attendance by id without schoolId', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockAttendance);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      status: 'ABSENT',
      remarks: 'Sick leave',
    };

    it('should update attendance fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockAttendance)
        .mockResolvedValueOnce({ ...mockAttendance, ...updateDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockAttendance)
        .mockResolvedValueOnce(mockAttendance);

      await service.update(1, 1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete attendance', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockAttendance);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'UPDATE attendance_records SET deleted_at = NOW()',
        ),
        [1],
      );
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStudent', () => {
    it('should return attendance for a student by academic year', async () => {
      mockDatabaseService.query.mockResolvedValue([mockAttendance]);

      const result = await service.findByStudent(1, '2081');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('student_id = $1 AND academic_year = $2'),
        [1, '2081'],
      );
    });

    it('should return attendance for a student by school id with date range', async () => {
      mockDatabaseService.query.mockResolvedValue([mockAttendance]);

      const start = new Date('2024-01-01');
      const end = new Date('2024-05-01');

      await service.findByStudent(1, 1, start, end);

      expect(mockDatabaseService.query).toHaveBeenCalled();
    });
  });

  describe('getStudentStatistics', () => {
    it('should return student attendance statistics', async () => {
      mockDatabaseService.query.mockResolvedValue([mockAttendance]);

      const result = await service.getStudentStatistics(1, '2081');

      expect(result).toBeDefined();
    });
  });
});
