import { Test, TestingModule } from '@nestjs/testing';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';

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
      providers: [{ provide: ResultService, useValue: mockService }],
    }).compile();
    controller = module.get<ResultController>(ResultController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
