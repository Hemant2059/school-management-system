import { Test, TestingModule } from '@nestjs/testing';
import { ReportCardController } from './report-card.controller';
import { ReportCardService } from './report-card.service';

describe('ReportCardController', () => {
  let controller: ReportCardController;
  let service: ReportCardService;

  const mockService = {
    generateBilingualReportCard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCardController],
      providers: [{ provide: ReportCardService, useValue: mockService }],
    }).compile();
    controller = module.get<ReportCardController>(ReportCardController);
    service = module.get<ReportCardService>(ReportCardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
