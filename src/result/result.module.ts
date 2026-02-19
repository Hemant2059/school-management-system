import { Module } from '@nestjs/common';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';
import { GradeModule } from '../grade/grade.module';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, GradeModule, AuditModule],
  controllers: [ResultController],
  providers: [ResultService],
  exports: [ResultService],
})
export class ResultModule {}
