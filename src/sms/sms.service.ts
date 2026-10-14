import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SmsTemplate {
  template_id: number;
  school_id: number;
  template_name: string;
  template_code: string;
  message_en: string;
  message_np: string;
  is_active: boolean;
}

export interface SmsLog {
  sms_log_id: number;
  school_id: number;
  recipient_phone: string;
  recipient_name: string;
  message: string;
  template_id: number;
  status: string;
  sent_at: Date;
  created_at: Date;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private db: DatabaseService) {}

  async sendSms(
    schoolId: number,
    dto: {
      phoneNumbers: string[];
      message: string;
      templateId?: number;
      recipientName?: string;
    },
  ): Promise<{ sent: number; failed: number; results: any[] }> {
    const results: any[] = [];
    let sent = 0;
    let failed = 0;

    for (const phone of dto.phoneNumbers) {
      try {
        const smsResult = await this.sendToProvider(phone, dto.message);

        await this.db.insert(
          `INSERT INTO sms_logs (school_id, recipient_phone, recipient_name, message, template_id, status, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            schoolId,
            phone,
            dto.recipientName || null,
            dto.message,
            dto.templateId || null,
            smsResult.status,
          ],
        );

        results.push({
          phone,
          status: smsResult.status,
          messageId: smsResult.messageId,
        });
        sent++;
      } catch (error) {
        results.push({ phone, status: 'FAILED', error: error.message });
        failed++;

        await this.db.insert(
          `INSERT INTO sms_logs (school_id, recipient_phone, recipient_name, message, template_id, status, sent_at)
           VALUES ($1, $2, $3, $4, $5, 'FAILED', NOW())`,
          [
            schoolId,
            phone,
            dto.recipientName || null,
            dto.message,
            dto.templateId || null,
          ],
        );
      }
    }

    return { sent, failed, results };
  }

  private async sendToProvider(
    phone: string,
    message: string,
  ): Promise<{ status: string; messageId: string }> {
    this.logger.log(`Sending SMS to ${phone}: ${message.substring(0, 50)}...`);

    return {
      status: 'SENT',
      messageId: `MSG-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  async sendAttendanceSms(
    schoolId: number,
    dto: {
      studentIds: number[];
      date: string;
      status: string;
    },
  ): Promise<{ sent: number; results: any[] }> {
    const students = await this.db.query(
      `SELECT s.student_id, s.first_name_en, s.student_mobile, sg.guardian_id, g.mobile as guardian_mobile
       FROM students s
       LEFT JOIN student_guardians sg ON s.student_id = sg.student_id AND sg.is_primary = true AND sg.is_active = true
       LEFT JOIN guardians g ON sg.guardian_id = g.guardian_id
       WHERE s.student_id = ANY($1) AND s.school_id = $2`,
      [dto.studentIds, schoolId],
    );

    const results: any[] = [];
    let sent = 0;

    for (const student of students) {
      const phone = student.guardian_mobile || student.student_mobile;
      if (!phone) continue;

      const message =
        dto.status === 'PRESENT'
          ? `Your child ${student.first_name_en} was PRESENT on ${dto.date}. - School`
          : `Your child ${student.first_name_en} was ABSENT on ${dto.date}. Please contact school. - School`;

      const result = await this.sendSms(schoolId, {
        phoneNumbers: [phone],
        message,
      });

      results.push({ studentId: student.student_id, ...result });
      sent++;
    }

    return { sent, results };
  }

  async sendFeeDueSms(
    schoolId: number,
    dto: {
      studentIds: number[];
      amount: number;
      dueDate: string;
    },
  ): Promise<{ sent: number; results: any[] }> {
    const students = await this.db.query(
      `SELECT s.student_id, s.first_name_en, sg.guardian_id, g.mobile as guardian_mobile
       FROM students s
       LEFT JOIN student_guardians sg ON s.student_id = sg.student_id AND sg.is_primary = true AND sg.is_active = true
       LEFT JOIN guardians g ON sg.guardian_id = g.guardian_id
       WHERE s.student_id = ANY($1) AND s.school_id = $2`,
      [dto.studentIds, schoolId],
    );

    const results: any[] = [];
    let sent = 0;

    for (const student of students) {
      const phone = student.guardian_mobile;
      if (!phone) continue;

      const message = `Dear Parent, fee of Rs. ${dto.amount} for your child ${student.first_name_en} is due on ${dto.dueDate}. Please pay soon. - School`;

      const result = await this.sendSms(schoolId, {
        phoneNumbers: [phone],
        message,
      });

      results.push({ studentId: student.student_id, ...result });
      sent++;
    }

    return { sent, results };
  }

  async sendEmergencyBroadcast(
    schoolId: number,
    dto: {
      message: string;
      targetType: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'STAFF';
    },
  ): Promise<{ sent: number }> {
    let recipients: string[] = [];

    if (dto.targetType === 'ALL' || dto.targetType === 'STUDENTS') {
      const students = await this.db.query(
        `SELECT DISTINCT COALESCE(g.mobile, s.student_mobile) as phone
         FROM students s
         LEFT JOIN student_guardians sg ON s.student_id = sg.student_id AND sg.is_active = true
         LEFT JOIN guardians g ON sg.guardian_id = g.guardian_id
         WHERE s.school_id = $1 AND s.is_active = true`,
        [schoolId],
      );
      recipients = students.map((s: any) => s.phone).filter(Boolean);
    }

    if (
      dto.targetType === 'ALL' ||
      dto.targetType === 'TEACHERS' ||
      dto.targetType === 'STAFF'
    ) {
      const staff = await this.db.query(
        `SELECT phone AS mobile FROM staff WHERE school_id = $1 AND is_active = true AND phone IS NOT NULL`,
        [schoolId],
      );
      recipients = [...recipients, ...staff.map((s: any) => s.mobile)];
    }

    const uniqueRecipients = [...new Set(recipients)];

    const result = await this.sendSms(schoolId, {
      phoneNumbers: uniqueRecipients,
      message: dto.message,
    });

    return { sent: result.sent };
  }

  async createTemplate(
    schoolId: number,
    dto: {
      templateName: string;
      templateCode: string;
      messageEn: string;
      messageNp: string;
      nameNp?: string;
      templateTextNp?: string;
    },
  ): Promise<SmsTemplate> {
    return this.db.insert<SmsTemplate>(
      `INSERT INTO sms_templates (school_id, name, name_np, template_text, template_text_np, template_name, template_code, message_en, message_np, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [
        schoolId,
        dto.templateName,
        dto.nameNp || null,
        dto.messageEn,
        dto.templateTextNp || null,
        dto.templateName,
        dto.templateCode,
        dto.messageEn,
        dto.messageNp,
      ],
    );
  }

  async getTemplates(schoolId: number): Promise<SmsTemplate[]> {
    return this.db.query(
      `SELECT * FROM sms_templates WHERE school_id = $1 AND is_active = true ORDER BY template_name`,
      [schoolId],
    );
  }

  async getSmsLogs(
    schoolId: number,
    query: {
      startDate?: string;
      endDate?: string;
      status?: string;
    },
  ): Promise<SmsLog[]> {
    let sql = `SELECT * FROM sms_logs WHERE school_id = $1`;
    const params: any[] = [schoolId];
    let paramIndex = 2;

    if (query.startDate) {
      sql += ` AND sent_at >= $${paramIndex++}`;
      params.push(query.startDate);
    }
    if (query.endDate) {
      sql += ` AND sent_at <= $${paramIndex++}`;
      params.push(query.endDate);
    }
    if (query.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    sql += ` ORDER BY sent_at DESC LIMIT 100`;

    return this.db.query(sql, params);
  }
}
