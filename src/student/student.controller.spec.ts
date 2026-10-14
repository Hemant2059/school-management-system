import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { RbacService } from '../database/rbac.service';
import { TenantService } from '../database/tenant.service';

describe('StudentController', () => {
  let controller: StudentController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getStudentWithFullDetails: jest.fn(),
    findByAdmissionNumber: jest.fn(),
    searchStudents: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        { provide: StudentService, useValue: mockService },
        { provide: RbacService, useValue: { getUserPermissions: jest.fn() } },
        { provide: TenantService, useValue: { resolveSchoolId: jest.fn() } },
      ],
    }).compile();
    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
