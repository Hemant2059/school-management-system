import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { DeoReportService } from './deo-report.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ComplianceController],
  providers: [DeoReportService],
  exports: [DeoReportService],
})
export class ComplianceModule {}
