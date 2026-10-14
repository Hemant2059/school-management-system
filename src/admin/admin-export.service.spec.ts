import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { DatabaseService } from '../database/database.service';

describe('AdminService export guards', () => {
  let service: AdminService;

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
        AdminService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  it('should refuse non-allowlisted tables', async () => {
    mockDatabaseService.query.mockResolvedValue([]);
    const result = await service.exportData(1, [
      'students',
      'user_sessions',
      'users; DROP TABLE users;--',
    ]);
    expect(Object.keys(result.data).sort()).toEqual(['students']);
  });

  it('should never select password hashes from users', async () => {
    mockDatabaseService.query.mockResolvedValue([]);
    await service.exportData(1, ['users']);
    const sql = mockDatabaseService.query.mock.calls[0][0];
    expect(sql).not.toMatch(/password_hash|password[^_]|reset_token/);
    expect(sql).toContain('full_name');
  });
});
