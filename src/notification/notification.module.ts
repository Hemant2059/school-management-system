import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { WhatsAppService } from './whatsapp.service';
import { DatabaseModule } from '../database/database.module';

// BullModule disabled - requires Redis
// import { BullModule } from '@nestjs/bullmq';
// import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    DatabaseModule,
    // BullModule.registerQueue({
    //   name: 'notification',
    // }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, WhatsAppService],
  exports: [NotificationService],
})
export class NotificationModule {}
