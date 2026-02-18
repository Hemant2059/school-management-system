import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { DatabaseService } from '../database/database.service';

describe('FeeService', () => {
  let service: FeeService;

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
        FeeService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<FeeService>(FeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
