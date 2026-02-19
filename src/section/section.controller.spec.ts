import { Test, TestingModule } from '@nestjs/testing';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';

describe('SectionController', () => {
  let controller: SectionController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectionController],
      providers: [{ provide: SectionService, useValue: mockService }],
    }).compile();
    controller = module.get<SectionController>(SectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
