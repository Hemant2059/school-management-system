import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';

describe('PaymentService verification (own ledger)', () => {
  let service: PaymentService;

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
        PaymentService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get<PaymentService>(PaymentService);
  });

  it('should report completed with real amount for verified rows', async () => {
    mockDatabaseService.queryOne.mockResolvedValue({
      amount: '5000',
      is_verified: true,
    });
    const result = await service.verifyPayment('TXN-1', 'ekhalti');
    expect(result).toEqual({
      transactionId: 'TXN-1',
      status: 'completed',
      amount: 5000,
      timestamp: expect.any(Date),
    });
  });

  it('should report pending for unverified rows (never fake completed)', async () => {
    mockDatabaseService.queryOne.mockResolvedValue({
      amount: '5000',
      is_verified: false,
    });
    const result = await service.verifyPayment('TXN-1', 'connectips');
    expect(result.status).toBe('pending');
    expect(result.amount).toBe(5000);
  });

  it('should report pending for unknown transactions', async () => {
    mockDatabaseService.queryOne.mockResolvedValue(null);
    const result = await service.verifyPayment('NOPE');
    expect(result.status).toBe('pending');
    expect(result.amount).toBe(0);
  });
});
