import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { Student } from '../student/entities/student.entity';
import { WhatsAppService } from './whatsapp.service';

import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Student]),
    BullModule.registerQueue({
      name: 'notification',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, WhatsAppService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
