import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

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
      providers: [{ provide: TeacherService, useValue: mockService }],
    }).compile();
    controller = module.get<TeacherController>(TeacherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
