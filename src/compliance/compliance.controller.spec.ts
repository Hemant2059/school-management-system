import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceController } from './compliance.controller';
import { DeoReportService } from './deo-report.service';
import { SeedAdminJsonService } from '../database/seeds/seed-admin-json.service';

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let deoReportService: DeoReportService;
  let seedAdminService: SeedAdminJsonService;

  const mockDeoReportService = {
    generateEnrollmentReport: jest.fn(),
    getFreeSeatReport: jest.fn(),
    getAnnualStatisticsReport: jest.fn(),
  };

  const mockSeedAdminService = {
    seed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: DeoReportService, useValue: mockDeoReportService },
        { provide: SeedAdminJsonService, useValue: mockSeedAdminService },
      ],
    }).compile();
    controller = module.get<ComplianceController>(ComplianceController);
    deoReportService = module.get<DeoReportService>(DeoReportService);
    seedAdminService = module.get<SeedAdminJsonService>(SeedAdminJsonService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
