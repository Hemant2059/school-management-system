import { Test, TestingModule } from '@nestjs/testing';
import { ResultService } from './result.service';
import { DatabaseService } from '../database/database.service';
import { GradeService } from '../grade/grade.service';
import { AuditService } from '../audit/audit.service';

describe('ResultService', () => {
  let service: ResultService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockGradeService = {
    findAll: jest.fn(),
    calculateGrade: jest.fn().mockReturnValue({
      grade: 'A',
      gradePoint: 4.0,
      gradeLabel: 'Outstanding',
    }),
    calculateGPA: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: GradeService, useValue: mockGradeService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();
    service = module.get<ResultService>(ResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
