import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { WhatsAppService } from './whatsapp.service';

export interface Notification {
  notification_id: number;
  title: string;
  message: string;
  type: string;
  school_id: number | null;
  user_id: number | null;
  is_read: boolean;
  sent_at: Date;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class NotificationService {
  private readonly MAX_RETRY_COUNT = 3;

  constructor(
    private db: DatabaseService,
    private whatsappService: WhatsAppService,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const result = await this.db.insert<Notification>(
      `INSERT INTO notifications (
        title, message, type, school_id, is_read
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        createDto.title,
        createDto.message,
        createDto.type || 'INFO',
        createDto.schoolId || null,
        false,
      ],
    );
    return result;
  }

  async findAll(
    schoolId?: number,
    studentId?: number,
    guardianId?: number,
    isRead?: boolean,
  ): Promise<Notification[]> {
    let query = `SELECT * FROM notifications WHERE is_active = true`;
    const params: any[] = [];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }
    if (studentId) {
      params.push(studentId);
      query += ` AND student_id = $${params.length}`;
    }
    if (guardianId) {
      params.push(guardianId);
      query += ` AND guardian_id = $${params.length}`;
    }
    if (isRead !== undefined) {
      params.push(isRead);
      query += ` AND is_read = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    return this.db.query<Notification>(query, params);
  }

  async findOne(id: number, schoolId?: number): Promise<Notification> {
    let query = `SELECT * FROM notifications WHERE notification_id = $1 AND is_active = true`;
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }

    const notification = await this.db.queryOne<Notification>(query, params);
    if (!notification)
      throw new NotFoundException(`Notification with ID ${id} not found`);
    return notification;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateNotificationDto,
  ): Promise<Notification> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields = [
      'title',
      'message',
      'message_np',
      'type',
      'is_read',
      'is_sms_sent',
    ];

    for (const field of fields) {
      if ((updateDto as any)[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push((updateDto as any)[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) return this.findOne(id, schoolId);

    params.push(id);
    await this.db.update(
      `UPDATE notifications SET ${updates.join(', ')} WHERE notification_id = $${paramIndex}`,
      params,
    );

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE notifications SET is_active = false WHERE notification_id = $1`,
      [id],
    );
  }

  async markAsRead(id: number, schoolId: number): Promise<Notification> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE notifications SET is_read = true WHERE notification_id = $1`,
      [id],
    );
    return this.findOne(id, schoolId);
  }

  async markAllAsRead(
    schoolId: number,
    studentId?: number,
    guardianId?: number,
  ): Promise<void> {
    let query = `UPDATE notifications SET is_read = true WHERE school_id = $1 AND is_read = false AND is_active = true`;
    const params: any[] = [schoolId];

    if (studentId) {
      params.push(studentId);
      query += ` AND student_id = $${params.length}`;
    }
    if (guardianId) {
      params.push(guardianId);
      query += ` AND guardian_id = $${params.length}`;
    }

    await this.db.update(query, params);
  }

  async sendSmsNotification(
    _notificationId: number,
    _schoolId: number,
    _phoneNumber?: string,
  ): Promise<boolean> {
    return true;
  }

  async sendSmsNotificationImpl(
    notificationId: number,
    schoolId: number,
    phoneNumber?: string,
  ): Promise<boolean> {
    const notification = await this.findOne(notificationId, schoolId);

    const to = phoneNumber || '+977-9800000000';
    const msg = notification.message;

    console.log(`📱 SMS/WhatsApp Notification Processing for Nepal:`);
    console.log(`   To: ${to}`);
    console.log(`   Message: ${msg}`);

    const success = await this.whatsappService.sendMessage(to, msg);

    return success;
  }
}
