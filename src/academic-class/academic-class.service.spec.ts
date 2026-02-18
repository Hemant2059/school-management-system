import { Test, TestingModule } from '@nestjs/testing';
import { AcademicClassService } from './academic-class.service';
import { DatabaseService } from '../database/database.service';

describe('AcademicClassService', () => {
  let service: AcademicClassService;

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
        AcademicClassService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<AcademicClassService>(AcademicClassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
