import { Test, TestingModule } from '@nestjs/testing';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { RbacService } from '../database/rbac.service';
import { TenantService } from '../database/tenant.service';

describe('ExamController', () => {
  let controller: ExamController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamController],
      providers: [
        { provide: ExamService, useValue: mockService },
        { provide: RbacService, useValue: { getUserPermissions: jest.fn() } },
        { provide: TenantService, useValue: { resolveSchoolId: jest.fn() } },
      ],
    }).compile();
    controller = module.get<ExamController>(ExamController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
