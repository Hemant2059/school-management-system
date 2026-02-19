import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;

  const mockService = {
    getSuggestions: jest.fn(),
    getDashboardInsights: jest.fn(),
    getHelp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: mockService }],
    }).compile();
    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
