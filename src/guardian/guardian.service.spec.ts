import { Test, TestingModule } from '@nestjs/testing';
import { GuardianService } from './guardian.service';
import { DatabaseService } from '../database/database.service';

describe('GuardianService', () => {
  let service: GuardianService;

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
        GuardianService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<GuardianService>(GuardianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
