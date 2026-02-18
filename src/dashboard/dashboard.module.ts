import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Student } from '../student/entities/student.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { Staff } from '../hr/entities/staff.entity';
import { Section } from '../section/entities/section.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { StudentFee } from '../fee/entities/student-fee.entity';
import { Payroll } from '../hr/entities/payroll.entity';
import { Notification } from '../notification/entities/notification.entity';
import { Guardian } from '../guardian/entities/guardian.entity';
import { StudentGuardian } from '../guardian/entities/student-guardian.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Teacher,
      Staff,
      Section,
      Attendance,
      Assignment,
      StudentFee,
      Payroll,
      Notification,
      Guardian,
      StudentGuardian,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
