import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { WhatsAppService } from './whatsapp.service';

export interface Notification {
  notification_id: number;
  title: string;
  title_np?: string | null;
  message: string;
  message_np?: string | null;
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

  /**
   * Resolve student/guardian targets to login user ids. Students hold no
   * logins, so student-targeted items fan out to the primary guardian's
   * account. Returns null when no narrowing applies (school-wide).
   */
  private async resolveTargetUserIds(
    schoolId: number,
    filter: { userId?: number; studentId?: number; guardianId?: number },
  ): Promise<number[] | null> {
    const ids = new Set<number>();
    if (filter.userId) ids.add(filter.userId);
    if (filter.guardianId) {
      const g = await this.db.queryOne<{ user_id: number | null }>(
        `SELECT user_id FROM guardians WHERE guardian_id = $1 AND school_id = $2 AND is_active = true`,
        [filter.guardianId, schoolId],
      );
      if (g?.user_id) ids.add(g.user_id);
    }
    if (filter.studentId) {
      const parents = await this.db.query<{ user_id: number }>(
        `SELECT g.user_id FROM student_guardians sg
          JOIN guardians g ON g.guardian_id = sg.guardian_id
         WHERE sg.student_id = $1 AND sg.is_primary = true AND sg.is_active = true
           AND g.school_id = $2 AND g.user_id IS NOT NULL`,
        [filter.studentId, schoolId],
      );
      for (const p of parents) ids.add(p.user_id);
    }
    if (
      filter.userId === undefined &&
      filter.studentId === undefined &&
      filter.guardianId === undefined
    ) {
      return null;
    }
    return [...ids];
  }

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const recipients = await this.resolveTargetUserIds(
      createDto.schoolId || 0,
      { studentId: createDto.studentId, guardianId: createDto.guardianId },
    );
    const userIds =
      recipients && recipients.length > 0 ? recipients : [null as any];
    let first: Notification | null = null;
    for (const userId of userIds) {
      first = await this.db.insert<Notification>(
        `INSERT INTO notifications (
          title, title_np, message, message_np, type, school_id, user_id, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          createDto.title,
          (createDto as any).titleNp || null,
          createDto.message,
          (createDto as any).messageNp || null,
          createDto.type || 'INFO',
          createDto.schoolId || null,
          userId,
          false,
        ],
      );
    }
    return first!;
  }

  async findAll(
    schoolId?: number,
    studentId?: number,
    guardianId?: number,
    isRead?: boolean,
    userId?: number,
  ): Promise<Notification[]> {
    let query = `SELECT * FROM notifications WHERE is_active = true`;
    const params: any[] = [];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }
    const targets = await this.resolveTargetUserIds(schoolId || 0, {
      userId,
      studentId,
      guardianId,
    });
    if (targets !== null) {
      if (targets.length === 0) return [];
      params.push(targets);
      query += ` AND (user_id = ANY($${params.length}) OR user_id IS NULL)`;
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

    const fields = ['title', 'message', 'type', 'is_read'];
    const npFieldMap: Record<string, string> = {
      titleNp: 'title_np',
      messageNp: 'message_np',
    };

    for (const field of fields) {
      if ((updateDto as any)[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push((updateDto as any)[field]);
        paramIndex++;
      }
    }

    for (const [dtoField, column] of Object.entries(npFieldMap)) {
      if ((updateDto as any)[dtoField] !== undefined) {
        updates.push(`${column} = $${paramIndex}`);
        params.push((updateDto as any)[dtoField] || null);
        paramIndex++;
      }
    }

    if (updates.length === 0) return this.findOne(id, schoolId);

    params.push(id, schoolId);
    await this.db.update(
      `UPDATE notifications SET ${updates.join(', ')}, updated_at = NOW() WHERE notification_id = $${paramIndex} AND school_id = $${paramIndex + 1}`,
      params,
    );

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE notifications SET is_active = false, updated_at = NOW() WHERE notification_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }

  async markAsRead(id: number, schoolId: number): Promise<Notification> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE notifications SET is_read = true, updated_at = NOW() WHERE notification_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    return this.findOne(id, schoolId);
  }

  async markAllAsRead(
    schoolId: number,
    studentId?: number,
    guardianId?: number,
    userId?: number,
  ): Promise<void> {
    let query = `UPDATE notifications SET is_read = true, updated_at = NOW() WHERE school_id = $1 AND is_read = false AND is_active = true`;
    const params: any[] = [schoolId];

    const targets = await this.resolveTargetUserIds(schoolId, {
      userId,
      studentId,
      guardianId,
    });
    if (targets !== null) {
      if (targets.length === 0) return;
      params.push(targets);
      query += ` AND user_id = ANY($${params.length})`;
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
