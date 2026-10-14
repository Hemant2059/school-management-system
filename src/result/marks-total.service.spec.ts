import { Test, TestingModule } from '@nestjs/testing';
import { ResultService } from './result.service';
import { DatabaseService } from '../database/database.service';
import { GradeService } from '../grade/grade.service';
import { AuditService } from '../audit/audit.service';

describe('ResultService total-marks rule', () => {
  let service: ResultService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockGradeService = {
    findAll: jest.fn().mockResolvedValue([]),
    calculateGrade: jest.fn().mockReturnValue({ grade: 'A', gradePoint: 4.0 }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: GradeService, useValue: mockGradeService },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();
    service = module.get<ResultService>(ResultService);
  });

  const base = {
    schoolId: 1,
    studentId: 3,
    examId: 1,
    subjectId: 1,
    fullMarks: 100,
  };

  it('create: breakdown wins over headline', async () => {
    mockDatabaseService.insert.mockResolvedValue({ mark_id: 1 });
    await service.create({
      ...base,
      marksObtained: 70,
      theoryMarks: 60,
      practicalMarks: 20,
    });
    const params = mockDatabaseService.insert.mock.calls[0][1];
    // marks_obtained ($8) and total_marks ($12) both 80, not 70, not 90
    expect(params[7]).toBe(80);
    expect(params[11]).toBe(80);
  });

  it('create: headline used when no breakdown', async () => {
    mockDatabaseService.insert.mockResolvedValue({ mark_id: 1 });
    await service.create({ ...base, marksObtained: 70 });
    const params = mockDatabaseService.insert.mock.calls[0][1];
    expect(params[7]).toBe(70);
    expect(params[11]).toBe(70);
  });

  it('create: absent scores 0', async () => {
    mockDatabaseService.insert.mockResolvedValue({ mark_id: 1 });
    await service.create({ ...base, marksObtained: 70, isAbsent: true });
    const params = mockDatabaseService.insert.mock.calls[0][1];
    expect(params[7]).toBe(0);
    expect(params[11]).toBe(0);
  });

  it('update: theory-only change adds stored practical', async () => {
    mockDatabaseService.queryOne.mockResolvedValue({
      mark_id: 1,
      school_id: 1,
      marks_obtained: 80,
      theory_marks: 60,
      practical_marks: 20,
      total_marks: 80,
      full_marks: 100,
      is_absent: false,
      status: 'DRAFT',
    });
    mockDatabaseService.query.mockResolvedValue([]);
    await service.update(1, { theoryMarks: 65 } as any);
    const params = mockDatabaseService.query.mock.calls[0][1];
    // total ($5) = 65 + stored 20; obtained ($2) mirrors total
    expect(params[4]).toBe(85);
    expect(params[1]).toBe(85);
  });

  it('update: untouched marks keep stored total', async () => {
    mockDatabaseService.queryOne.mockResolvedValue({
      mark_id: 1,
      school_id: 1,
      marks_obtained: 80,
      theory_marks: 60,
      practical_marks: 20,
      total_marks: 80,
      full_marks: 100,
      is_absent: false,
      status: 'DRAFT',
    });
    mockDatabaseService.query.mockResolvedValue([]);
    await service.update(1, { remarks: 'ok' } as any);
    const params = mockDatabaseService.query.mock.calls[0][1];
    expect(params[4]).toBe(80);
    expect(params[1]).toBeNull();
  });
});
