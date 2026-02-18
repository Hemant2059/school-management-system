import { Module } from '@nestjs/common';
import { AcademicClassController } from './academic-class.controller';
import { AcademicClassService } from './academic-class.service';

@Module({
  controllers: [AcademicClassController],
  providers: [AcademicClassService],
  exports: [AcademicClassService],
})
export class AcademicClassModule {}
