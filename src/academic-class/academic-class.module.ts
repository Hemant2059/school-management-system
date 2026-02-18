import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicClassController } from './academic-class.controller';
import { AcademicClassService } from './academic-class.service';
import { AcademicClass } from './entities/academic-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicClass])],
  controllers: [AcademicClassController],
  providers: [AcademicClassService],
  exports: [AcademicClassService],
})
export class AcademicClassModule {}
