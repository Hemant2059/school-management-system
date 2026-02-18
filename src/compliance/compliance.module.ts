import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { DeoReportService } from './deo-report.service';
import { Student } from '../student/entities/student.entity';
import { School } from '../school/entities/school.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { AcademicClass } from '../academic-class/entities/academic-class.entity';
import { Section } from '../section/entities/section.entity';
import { Province } from '../database/entities/province.entity';
import { District } from '../database/entities/district.entity';
import { LocalBody } from '../database/entities/local-body.entity';
import { Ward } from '../database/entities/ward.entity';
import { SeedAdminJsonService } from '../database/seeds/seed-admin-json.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      School,
      Enrollment,
      AcademicClass,
      Section,
      Province,
      District,
      LocalBody,
      Ward,
    ]),
  ],
  controllers: [ComplianceController],
  providers: [DeoReportService, SeedAdminJsonService],
  exports: [DeoReportService, SeedAdminJsonService],
})
export class ComplianceModule {}
