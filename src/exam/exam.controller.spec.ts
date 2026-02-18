import { Test, TestingModule } from '@nestjs/testing';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

describe('ExamController', () => {
  let controller: ExamController;
  let service: ExamService;

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
      providers: [{ provide: ExamService, useValue: mockService }],
    }).compile();
    controller = module.get<ExamController>(ExamController);
    service = module.get<ExamService>(ExamService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
