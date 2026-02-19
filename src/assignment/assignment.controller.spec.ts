import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';

describe('AssignmentController', () => {
  let controller: AssignmentController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentController],
      providers: [{ provide: AssignmentService, useValue: mockService }],
    }).compile();
    controller = module.get<AssignmentController>(AssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
