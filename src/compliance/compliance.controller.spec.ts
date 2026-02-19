import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceController } from './compliance.controller';
import { DeoReportService } from './deo-report.service';

describe('ComplianceController', () => {
  let controller: ComplianceController;

  const mockDeoReportService = {
    generateEnrollmentReport: jest.fn(),
    getFreeSeatReport: jest.fn(),
    getAnnualStatisticsReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: DeoReportService, useValue: mockDeoReportService },
      ],
    }).compile();
    controller = module.get<ComplianceController>(ComplianceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
