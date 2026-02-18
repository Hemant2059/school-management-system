import { Module } from '@nestjs/common';
import { VideoClassService } from './video-class.service';
import { VideoClassController } from './video-class.controller';

@Module({
  controllers: [VideoClassController],
  providers: [VideoClassService],
  exports: [VideoClassService],
})
export class VideoClassModule {}
