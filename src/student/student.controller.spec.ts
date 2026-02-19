import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

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
      providers: [{ provide: StudentService, useValue: mockService }],
    }).compile();
    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
