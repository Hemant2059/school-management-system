import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';
import { Mark } from './entities/mark.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mark])],
  controllers: [ResultController],
  providers: [ResultService],
  exports: [ResultService],
})
export class ResultModule {}
