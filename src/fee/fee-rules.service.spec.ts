import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FeeService rules (discount + penalty)', () => {
  let service: FeeService;

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
        FeeService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<FeeService>(FeeService);
  });

  describe('createDiscountRule', () => {
    const dto = {
      schoolId: 1,
      code: 'SIB10',
      nameEn: 'Sibling Discount',
      nameNp: 'दाजुभाइ छुट',
      discountType: 'PERCENT' as const,
      value: 10,
    };

    it('should create with EN+NP stored verbatim', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({ ...dto, discount_rule_id: 1 });
      const result = await service.createDiscountRule(dto);
      expect(result.discount_rule_id).toBe(1);
      const params = mockDatabaseService.insert.mock.calls[0][1];
      expect(params).toContain('दाजुभाइ छुट');
    });

    it('should reject duplicate code per school', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ discount_rule_id: 9 });
      await expect(service.createDiscountRule(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateDiscountRule', () => {
    it('should throw for missing rule', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      await expect(
        service.updateDiscountRule(1, 1, { value: 15 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ discount_rule_id: 1 });
      mockDatabaseService.insert.mockResolvedValue({ discount_rule_id: 1, value: 15 });
      const result = await service.updateDiscountRule(1, 1, { value: 15 });
      expect(result.value).toBe(15);
      const sql = mockDatabaseService.insert.mock.calls[0][0];
      expect(sql).toContain('value = $1');
      expect(sql).not.toContain('name_np');
    });
  });

  describe('deleteDiscountRule', () => {
    it('should soft-delete', async () => {
      mockDatabaseService.update.mockResolvedValue(1);
      await service.deleteDiscountRule(1, 1);
      const sql = mockDatabaseService.update.mock.calls[0][0];
      expect(sql).toContain('is_active = false');
    });

    it('should throw for missing rule', async () => {
      mockDatabaseService.update.mockResolvedValue(0);
      await expect(service.deleteDiscountRule(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPenaltyRule', () => {
    const dto = {
      schoolId: 1,
      code: 'LATE1',
      nameEn: 'Late Penalty',
      nameNp: 'ढिलो जरिवाना',
      mode: 'FLAT' as const,
      amount: 50,
    };

    it('should create with EN+NP stored verbatim', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({ ...dto, penalty_rule_id: 1 });
      const result = await service.createPenaltyRule(dto);
      expect(result.penalty_rule_id).toBe(1);
      const params = mockDatabaseService.insert.mock.calls[0][1];
      expect(params).toContain('ढिलो जरिवाना');
    });

    it('should reject duplicate code per school', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ penalty_rule_id: 9 });
      await expect(service.createPenaltyRule(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deletePenaltyRule', () => {
    it('should throw for missing rule', async () => {
      mockDatabaseService.update.mockResolvedValue(0);
      await expect(service.deletePenaltyRule(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
