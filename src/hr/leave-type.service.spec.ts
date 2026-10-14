import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('HrService leave types', () => {
  let service: HrService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

  describe('createLeaveType', () => {
    it('should store EN+NP verbatim', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({
        id: 1,
        name: 'Sick Leave',
      });
      const result = await service.createLeaveType({
        schoolId: 1,
        name: 'Sick Leave',
        nameNp: 'बिरामी बिदा',
        maxDaysPerYear: 12,
        isPaid: true,
      });
      expect(result.id).toBe(1);
      expect(mockDatabaseService.insert.mock.calls[0][1]).toContain(
        'बिरामी बिदा',
      );
    });

    it('should reject duplicate name per school', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ id: 9 });
      await expect(
        service.createLeaveType({ schoolId: 1, name: 'Sick Leave' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteLeaveType', () => {
    it('should block while pending requests exist', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ count: '2' });
      await expect(service.deleteLeaveType(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should soft-delete when unused', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ count: '0' });
      mockDatabaseService.update.mockResolvedValue(1);
      await service.deleteLeaveType(1, 1);
      expect(mockDatabaseService.update.mock.calls[0][0]).toContain(
        'is_active = false',
      );
    });
  });

  describe('rejectLeaveRequest', () => {
    it('should store rejection BS verbatim', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({
        leave_request_id: 1,
        status: 'PENDING',
      });
      mockDatabaseService.insert.mockResolvedValue({ leave_request_id: 1 });
      await service.rejectLeaveRequest(1, 'No cover', 'कभर छैन');
      expect(mockDatabaseService.insert.mock.calls[0][1]).toEqual([
        'No cover',
        'कभर छैन',
        1,
      ]);
    });
  });

  describe('updateLeaveType', () => {
    it('should throw for missing type', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      await expect(
        service.updateLeaveType(1, 1, { nameNp: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
