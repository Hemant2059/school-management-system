import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class NotificationService {
  private readonly MAX_RETRY_COUNT = 3;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private whatsappService: WhatsAppService,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createDto,
      isRead: false,
      isSmsSent: false,
      isActive: true,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(
    schoolId?: number,
    studentId?: number,
    guardianId?: number,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const where: any = { isActive: true };
    if (schoolId) where.schoolId = schoolId;
    if (studentId) where.studentId = studentId;
    if (guardianId) where.guardianId = guardianId;
    if (isRead !== undefined) where.isRead = isRead;

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Notification> {
    const where: any = { notificationId: id, isActive: true };
    if (schoolId) where.schoolId = schoolId;

    const notification = await this.notificationRepository.findOne({
      where,
    });
    if (!notification)
      throw new NotFoundException(`Notification with ID ${id} not found`);
    return notification;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id, schoolId);
    Object.assign(notification, updateDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.notificationRepository.update(id, { isActive: false });
  }

  async markAsRead(id: number, schoolId: number): Promise<Notification> {
    const notification = await this.findOne(id, schoolId);
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(
    schoolId: number,
    studentId?: number,
    guardianId?: number,
  ): Promise<void> {
    const where: any = { schoolId, isRead: false, isActive: true };
    if (studentId) where.studentId = studentId;
    if (guardianId) where.guardianId = guardianId;
    await this.notificationRepository.update(where, { isRead: true });
  }

  /**
   * Producer: Adds SMS job to the queue
   */
  async sendSmsNotification(
    notificationId: number,
    schoolId: number,
    phoneNumber?: string,
  ): Promise<boolean> {
    await this.notificationQueue.add('send-sms', {
      notificationId,
      schoolId,
      phoneNumber,
    });
    return true; // Accepted for processing
  }

  /**
   * Consumer: Actual logic executed by the worker
   */
  async sendSmsNotificationImpl(
    notificationId: number,
    schoolId: number,
    phoneNumber?: string,
  ): Promise<boolean> {
    const notification = await this.findOne(notificationId, schoolId);

    // Nepal format required for WhatsApp: +977-98XXXXXXXX
    const to = phoneNumber || '+977-9800000000'; // Default or fetched from student/guardian
    const msg = notification.messageNp || notification.message;

    console.log(`📱 SMS/WhatsApp Notification Processing for Nepal:`);
    console.log(`   To: ${to}`);
    console.log(`   Message: ${msg}`);

    const success = await this.whatsappService.sendMessage(to, msg);

    if (success) {
      notification.isSmsSent = true;
      notification.requiresManualFollowup = false;
    } else {
      notification.retryCount += 1;
      if (notification.retryCount >= this.MAX_RETRY_COUNT) {
        notification.requiresManualFollowup = true;
        console.error(
          `🚨 Notification ${notificationId} failed after ${notification.retryCount} retries. Manual follow-up required!`,
        );
      }
    }

    await this.notificationRepository.save(notification);
    return success;
  }
}
