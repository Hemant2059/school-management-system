import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';

describe('FeeService invoice discounts', () => {
  let service: FeeService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(async (cb: any) => cb(mockClient)),
  };
  const mockClient = { query: jest.fn() };

  const rule = {
    discount_rule_id: 1,
    school_id: 1,
    code: 'SIB10',
    discount_type: 'PERCENT',
    value: '10',
    valid_from_ad: null,
    valid_to_ad: null,
    is_stackable: false,
  };
  const invoice = {
    invoice_id: 7,
    school_id: 1,
    student_id: 3,
    academic_year_id: 1,
    subtotal: '12000',
    discount_total: '0',
    paid_amount: '0',
    status: 'ISSUED',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDatabaseService.transaction.mockImplementation(async (cb: any) =>
      cb(mockClient),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<FeeService>(FeeService);
  });

  function mockEvaluateAvailable() {
    // Reset first: an earlier test may have left unconsumed Once values
    // behind when evaluation threw partway through its query chain.
    mockDatabaseService.queryOne.mockReset();
    mockDatabaseService.queryOne
      .mockResolvedValueOnce(rule) // rule
      .mockResolvedValueOnce({ student_id: 3 }) // student
      .mockResolvedValueOnce(invoice) // invoice
      .mockResolvedValueOnce(null); // no prior approved (non-stackable)
  }

  describe('applyInvoiceDiscount', () => {
    it('should compute 10% of 12000 and record PENDING', async () => {
      mockEvaluateAvailable();
      mockDatabaseService.insert.mockResolvedValue({
        student_discount_id: 1,
        status: 'PENDING',
      });
      const result = await service.applyInvoiceDiscount({
        schoolId: 1,
        studentId: 3,
        discountRuleId: 1,
      });
      expect(result.computed_amount).toBe(1200);
      expect(result.status).toBe('PENDING');
    });

    it('should reject expired rules', async () => {
      mockDatabaseService.queryOne.mockResolvedValueOnce({
        ...rule,
        valid_to_ad: '2020-01-01',
      });
      await expect(
        service.applyInvoiceDiscount({
          schoolId: 1,
          studentId: 3,
          discountRuleId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-stackable duplicates', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(rule)
        .mockResolvedValueOnce({ student_id: 3 })
        .mockResolvedValueOnce(invoice)
        .mockResolvedValueOnce({ student_discount_id: 9 });
      await expect(
        service.applyInvoiceDiscount({
          schoolId: 1,
          studentId: 3,
          discountRuleId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject fully-discounted invoices', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(rule)
        .mockResolvedValueOnce({ student_id: 3 })
        .mockResolvedValueOnce({ ...invoice, discount_total: '12000' })
        .mockResolvedValueOnce(null);
      await expect(
        service.applyInvoiceDiscount({
          schoolId: 1,
          studentId: 3,
          discountRuleId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveInvoiceDiscount', () => {
    it('should post discount_total inside a transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              ...invoice,
              status: 'PENDING',
              student_discount_id: 1,
              school_id: 1,
              student_id: 3,
              discount_rule_id: 1,
              academic_year_id: 1,
              invoice_id: 7,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // invoice update
        .mockResolvedValueOnce({
          rows: [{ student_discount_id: 1, status: 'APPROVED' }],
        });
      mockEvaluateAvailable();
      const result = await service.approveInvoiceDiscount(1, 2);
      expect(result.applied_amount).toBe(1200);
      const invoiceUpdate = mockClient.query.mock.calls[1];
      expect(invoiceUpdate[0]).toContain(
        'discount_total = discount_total + $1',
      );
      expect(invoiceUpdate[1]).toEqual([1200, 7]);
    });

    it('should refuse non-pending records', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ student_discount_id: 1, status: 'APPROVED' }],
      });
      await expect(service.approveInvoiceDiscount(1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
