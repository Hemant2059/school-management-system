import { Test, TestingModule } from '@nestjs/testing';
import { AcademicClassController } from './academic-class.controller';
import { AcademicClassService } from './academic-class.service';

describe('AcademicClassController', () => {
  let controller: AcademicClassController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getClassesByLevel: jest.fn(),
    findOne: jest.fn(),
    findBySchoolAndCode: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicClassController],
      providers: [{ provide: AcademicClassService, useValue: mockService }],
    }).compile();
    controller = module.get<AcademicClassController>(AcademicClassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
