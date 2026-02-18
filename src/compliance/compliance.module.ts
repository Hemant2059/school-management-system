import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { DeoReportService } from './deo-report.service';
import { DatabaseModule } from '../database/database.module';
import { SeedAdminJsonService } from '../database/seeds/seed-admin-json.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ComplianceController],
  providers: [DeoReportService, SeedAdminJsonService],
  exports: [DeoReportService],
})
export class ComplianceModule {}
