import { Test, TestingModule } from '@nestjs/testing';
import { HrService, Staff } from './hr.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('HrService', () => {
  let service: HrService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockStaff: Staff = {
    staff_id: 1,
    school_id: 1,
    user_id: 1,
    staff_code: 'STF-001',
    first_name_en: 'John',
    middle_name_en: null,
    last_name_en: 'Doe',
    first_name_np: 'जोन',
    middle_name_np: null,
    last_name_np: 'डोन',
    email: 'john@school.edu.np',
    mobile: '9841234567',
    department: 'Science',
    designation: 'Teacher',
    employment_type: 'PERMANENT',
    joining_date: new Date('2020-01-01'),
    current_status: 'ACTIVE',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<HrService>(HrService);
  });

  describe('createStaff', () => {
    it('should create a new staff successfully', async () => {
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockStaff);

      const result = await service.createStaff({
        schoolId: 1,
        userId: 1,
        firstNameEn: 'Jane',
        lastNameEn: 'Smith',
        gender: 'female',
        position: 'Teacher',
        hireDate: new Date(),
      } as any);

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAllStaff', () => {
    it('should return all staff for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockStaff]);

      const result = await service.findAllStaff(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM staff'),
        [1],
      );
    });

    it('should return empty array if no staff', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAllStaff(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOneStaff', () => {
    it('should return staff by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockStaff);

      const result = await service.findOneStaff(1, 1);

      expect(result).toEqual(mockStaff);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE staff_id = $1'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if staff not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOneStaff(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processPayroll', () => {
    it('should process payroll successfully', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockStaff);
      mockDatabaseService.insert.mockResolvedValue({
        payroll_id: 1,
        school_id: 1,
        staff_id: 1,
      });

      const result = await service.processPayroll({
        schoolId: 1,
        staffId: 1,
        salaryMonthBs: '2081-02',
        basicSalary: 50000,
      } as any);

      expect(result).toBeDefined();
    });
  });

  describe('getStaffPayroll', () => {
    it('should return payroll for a staff member', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.getStaffPayroll(1, 1);

      expect(result).toBeDefined();
    });
  });

  describe('createLeaveRequest', () => {
    it('should create leave request successfully', async () => {
      mockDatabaseService.insert.mockResolvedValue({
        leave_request_id: 1,
      });

      const result = await service.createLeaveRequest({
        schoolId: 1,
        staffId: 1,
        leaveTypeId: 1,
        startDate: new Date(),
        endDate: new Date(),
        daysRequested: 5,
      } as any);

      expect(result).toBeDefined();
    });
  });

  describe('generatePayslip', () => {
    it('should throw NotFoundException if payroll not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.generatePayslip(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
