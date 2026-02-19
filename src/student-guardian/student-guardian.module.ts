import { Module } from '@nestjs/common';
import { StudentGuardianController } from './student-guardian.controller';
import { StudentGuardianService } from './student-guardian.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StudentGuardianController],
  providers: [StudentGuardianService],
  exports: [StudentGuardianService],
})
export class StudentGuardianModule {}
