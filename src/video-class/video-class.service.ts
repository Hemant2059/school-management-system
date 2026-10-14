import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

export interface LiveClass {
  id?: number;
  schoolId: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  title: string;
  description?: string;
  scheduledAt: Date;
  scheduledAtBs: string;
  duration: number;
  platform: 'jitsi' | 'zoom' | 'meet';
  meetingId: string;
  meetingUrl: string;
  hostUrl?: string;
  password?: string;
  status: 'scheduled' | 'live' | 'ended';
  recordingEnabled: boolean;
  recordingUrl?: string;
  createdAt?: Date;
}

export interface CreateLiveClassDto {
  classId?: number;
  subjectId?: number;
  teacherId?: number;
  title: string;
  classNameNp?: string;
  titleNp?: string;
  description?: string;
  descriptionNp?: string;
  scheduledAt: string;
  scheduledAtBs?: string;
  duration?: number;
  platform?: 'jitsi' | 'zoom' | 'meet';
  recordingEnabled?: boolean;
}

@Injectable()
export class VideoClassService {
  private jitsiDomain: string;
  private zoomApiKey: string;
  private zoomApiSecret: string;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    this.jitsiDomain = this.configService.get('JITSI_DOMAIN') || 'meet.jit.si';
    this.zoomApiKey = this.configService.get('ZOOM_API_KEY') || '';
    this.zoomApiSecret = this.configService.get('ZOOM_API_SECRET') || '';
  }

  async createLiveClass(
    schoolId: number,
    userId: number,
    dto: CreateLiveClassDto,
  ): Promise<LiveClass> {
    // Find teacher by user_id, or use provided teacherId (scoped to school
    // so one school cannot bind another school's teacher row).
    let teacherId = dto.teacherId;
    if (!teacherId && userId) {
      const teacher = await this.databaseService.queryOne<{
        teacher_id: number;
      }>(
        'SELECT teacher_id FROM teachers WHERE user_id = $1 AND school_id = $2',
        [userId, schoolId],
      );
      if (teacher) {
        teacherId = teacher.teacher_id;
      }
    } else if (teacherId) {
      const teacher = await this.databaseService.queryOne<{
        teacher_id: number;
      }>(
        'SELECT teacher_id FROM teachers WHERE teacher_id = $1 AND school_id = $2 AND is_active = true',
        [teacherId, schoolId],
      );
      if (!teacher) {
        throw new NotFoundException('Teacher not found in this school');
      }
    }

    const { meetingId, meetingUrl, hostUrl, password } =
      this.generateMeetingDetails(dto.platform || 'zoom');

    const query = `
      INSERT INTO live_classes (
        school_id, class_id, subject_id, teacher_id, class_name, class_name_np, description, description_np,
        scheduled_at, scheduled_at_bs, duration, platform, meeting_id,
        meeting_url, host_url, password, status, recording_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      dto.classId || null,
      dto.subjectId || null,
      teacherId || null,
      dto.title,
      dto.classNameNp || dto.titleNp || null,
      dto.description || null,
      dto.descriptionNp || null,
      dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      // BS date comes from the frontend — the backend stores it as given.
      dto.scheduledAtBs || null,
      dto.duration || null,
      dto.platform || null,
      meetingId,
      meetingUrl,
      hostUrl,
      password,
      'scheduled',
      dto.recordingEnabled || false,
    ]);

    return result[0];
  }

  async getLiveClasses(
    schoolId: number,
    classId?: number,
  ): Promise<LiveClass[]> {
    let query =
      'SELECT * FROM live_classes WHERE school_id = $1 AND deleted_at IS NULL';
    const params: any[] = [schoolId];

    if (classId) {
      query += ' AND class_id = $2';
      params.push(classId);
    }

    query += ' ORDER BY scheduled_at DESC';

    return this.databaseService.query(query, params);
  }

  async getLiveClassById(id: number, schoolId: number): Promise<LiveClass> {
    const query =
      'SELECT * FROM live_classes WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL';
    const result = await this.databaseService.query(query, [id, schoolId]);
    if (!result[0]) {
      throw new NotFoundException('Live class not found');
    }
    return result[0];
  }

  async startLiveClass(id: number, schoolId: number): Promise<LiveClass> {
    const query = `
      UPDATE live_classes 
      SET status = 'live', started_at = NOW()
      WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.databaseService.query(query, [id, schoolId]);
    if (!result[0]) {
      throw new NotFoundException('Live class not found');
    }
    return result[0];
  }

  async endLiveClass(
    id: number,
    schoolId: number,
    recordingUrl?: string,
  ): Promise<LiveClass> {
    try {
      const query = `
        UPDATE live_classes 
        SET status = 'ended', actual_end = NOW(), recording_url = $3
        WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL
        RETURNING *
      `;
      const result = await this.databaseService.query(query, [
        id,
        schoolId,
        recordingUrl || null,
      ]);

      if (!result || result.length === 0 || !result[0]) {
        throw new NotFoundException('Live class not found');
      }

      return result[0];
    } catch (error) {
      console.error('Error ending live class:', error);
      throw error;
    }
  }

  async deleteLiveClass(id: number, schoolId: number): Promise<void> {
    const affected = await this.databaseService.update(
      'UPDATE live_classes SET deleted_at = NOW() WHERE id = $1 AND school_id = $2 AND deleted_at IS NULL',
      [id, schoolId],
    );
    if (affected === 0) {
      throw new NotFoundException('Live class not found');
    }
  }

  async getUpcomingClasses(schoolId: number): Promise<LiveClass[]> {
    const query = `
      SELECT * FROM live_classes 
      WHERE school_id = $1 
        AND status = 'scheduled' 
        AND scheduled_at > NOW()
        AND deleted_at IS NULL
      ORDER BY scheduled_at ASC
      LIMIT 10
    `;
    return this.databaseService.query(query, [schoolId]);
  }

  async getLiveNowClasses(schoolId: number): Promise<LiveClass[]> {
    const query = `
      SELECT * FROM live_classes 
      WHERE school_id = $1 AND status = 'live' AND deleted_at IS NULL
    `;
    return this.databaseService.query(query, [schoolId]);
  }

  private generateMeetingDetails(platform: 'jitsi' | 'zoom' | 'meet') {
    const meetingId = this.generateMeetingId();
    let meetingUrl: string;
    let hostUrl: string;
    let password: string;

    switch (platform) {
      case 'jitsi':
        password = this.generatePassword(8);
        meetingUrl = `https://${this.jitsiDomain}/${meetingId}`;
        hostUrl = `https://${this.jitsiDomain}/${meetingId}#config.prejoinPageEnabled=false`;
        break;
      case 'zoom':
        password = this.generatePassword(6);
        meetingUrl = `https://zoom.us/j/${meetingId}?pwd=${password}`;
        hostUrl = `https://zoom.us/s/${meetingId}?zak=`;
        break;
      case 'meet':
        password = this.generatePassword(6);
        meetingUrl = `https://meet.google.com/${meetingId}`;
        hostUrl = `https://meet.google.com/${meetingId}`;
        break;
    }

    return { meetingId, meetingUrl, hostUrl, password };
  }

  private generateMeetingId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 3; i++) {
      if (i > 0) result += '-';
      for (let j = 0; j < 3; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  }

  private generatePassword(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
