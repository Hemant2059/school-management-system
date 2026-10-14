import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { RbacService } from '../database/rbac.service';
import { TenantService } from '../database/tenant.service';

describe('TeacherController', () => {
  let controller: TeacherController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getTeacherWithDetails: jest.fn(),
    findByEmployeeId: jest.fn(),
    searchTeachers: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherController],
      providers: [
        { provide: TeacherService, useValue: mockService },
        { provide: RbacService, useValue: { getUserPermissions: jest.fn() } },
        { provide: TenantService, useValue: { resolveSchoolId: jest.fn() } },
      ],
    }).compile();
    controller = module.get<TeacherController>(TeacherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
