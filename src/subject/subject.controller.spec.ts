import { Test, TestingModule } from '@nestjs/testing';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';

describe('SubjectController', () => {
  let controller: SubjectController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getSubjectsByGroup: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectController],
      providers: [{ provide: SubjectService, useValue: mockService }],
    }).compile();
    controller = module.get<SubjectController>(SubjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
