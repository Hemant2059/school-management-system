import { Module } from '@nestjs/common';
import { GradeController } from './grade.controller';
import { GradeService } from './grade.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService],
})
export class GradeModule {}
