import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';
import { Guardian } from './entities/guardian.entity';
import { StudentGuardian } from './entities/student-guardian.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Guardian, StudentGuardian])],
  controllers: [GuardianController],
  providers: [GuardianService],
  exports: [GuardianService],
})
export class GuardianModule {}
