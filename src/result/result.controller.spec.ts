import { Test, TestingModule } from '@nestjs/testing';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';
import { RbacService } from '../database/rbac.service';
import { TenantService } from '../database/tenant.service';

describe('ResultController', () => {
  let controller: ResultController;

  const mockService = {
    calculateAndSaveMarks: jest.fn(),
    generateReportCard: jest.fn(),
    getStudentResults: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultController],
      providers: [
        { provide: ResultService, useValue: mockService },
        { provide: RbacService, useValue: { getUserPermissions: jest.fn() } },
        { provide: TenantService, useValue: { resolveSchoolId: jest.fn() } },
      ],
    }).compile();
    controller = module.get<ResultController>(ResultController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
