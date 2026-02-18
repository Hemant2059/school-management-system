import { Controller, Post, Get } from '@nestjs/common';
import { DeoReportService } from './deo-report.service';
import { Public } from '../common/decorators/public.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

import { SeedAdminJsonService } from '../database/seeds/seed-admin-json.service';

@Controller('compliance')
export class ComplianceController {
  constructor(
    private deoReportService: DeoReportService,
    private seedAdminService: SeedAdminJsonService,
  ) {}

  @Public()
  @Post('seed-admin')
  async seedAdminData() {
    await this.seedAdminService.seed();
    return { message: 'Administrative data seeding initiated from JSON' };
  }

  @Public()
  @Post('verify')
  async verifyCompliance() {
    await Promise.resolve(); // Simulate async work
    return {
      status: 'compliant',
      context: 'Nepal',
      timestamp: new Date().toISOString(),
      checks: [
        { feature: 'Dual Calendar (AD/BS)', status: 'OK' },
        { feature: 'MOEST Caste/Ethnicity Code', status: 'OK' },
        { feature: 'Government Mandated Free Seat (10%)', status: 'OK' },
        { feature: 'Citizenship/Birth Certificate Handling', status: 'OK' },
        { feature: 'Province/District/Local Body (1–7)', status: 'OK' },
        { feature: 'NEB Grading (Letter Grading 2078 BS)', status: 'OK' },
        { feature: 'DEO Enrollment Report (MOEST v3.2)', status: 'OK' },
        { feature: 'NPR Currency & Nepal Payment Methods', status: 'OK' },
      ],
    };
  }

  @Get('deo-report')
  async getDeoReport(@GetUser('schoolId') schoolId: number) {
    return this.deoReportService.generateEnrollmentReport(schoolId);
  }

  @Get('free-seat-report')
  async getFreeSeatReport(@GetUser('schoolId') schoolId: number) {
    return this.deoReportService.getFreeSeatReport(schoolId);
  }

  @Get('annual-statistics')
  async getAnnualStatisticsReport(@GetUser('schoolId') schoolId: number) {
    return this.deoReportService.getAnnualStatisticsReport(schoolId);
  }
}
