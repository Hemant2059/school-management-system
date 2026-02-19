import { Module } from '@nestjs/common';
import { AcademicCalendarService } from './academic-calendar.service';
import { AcademicCalendarController } from './academic-calendar.controller';

@Module({
  providers: [AcademicCalendarService],
  controllers: [AcademicCalendarController],
  exports: [AcademicCalendarService],
})
export class AcademicCalendarModule {}
