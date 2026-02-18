import { Test, TestingModule } from '@nestjs/testing';
import { DeoReportService } from './deo-report.service';
import { DatabaseService } from '../database/database.service';

describe('DeoReportService', () => {
  let service: DeoReportService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeoReportService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<DeoReportService>(DeoReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
