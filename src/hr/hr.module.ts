import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { Staff } from './entities/staff.entity';
import { Payroll } from './entities/payroll.entity';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveRequest } from './entities/leave-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Staff, Payroll, LeaveType, LeaveRequest]),
  ],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
