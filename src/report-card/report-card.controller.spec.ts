import { Test, TestingModule } from '@nestjs/testing';
import { ReportCardController } from './report-card.controller';
import { ReportCardService } from './report-card.service';

describe('ReportCardController', () => {
  let controller: ReportCardController;

  const mockService = {
    generateBilingualReportCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCardController],
      providers: [{ provide: ReportCardService, useValue: mockService }],
    }).compile();
    controller = module.get<ReportCardController>(ReportCardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
