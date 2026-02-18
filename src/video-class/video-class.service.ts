import { Injectable, BadRequestException } from '@nestjs/common';
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
  classId: number;
  subjectId: number;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  platform: 'jitsi' | 'zoom' | 'meet';
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
    teacherId: number,
    dto: CreateLiveClassDto,
  ): Promise<LiveClass> {
    const { meetingId, meetingUrl, hostUrl, password } =
      this.generateMeetingDetails(dto.platform);

    const query = `
      INSERT INTO live_classes (
        school_id, class_id, subject_id, teacher_id, title, description,
        scheduled_at, scheduled_at_bs, duration, platform, meeting_id,
        meeting_url, host_url, password, status, recording_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      dto.classId,
      dto.subjectId,
      teacherId,
      dto.title,
      dto.description,
      new Date(dto.scheduledAt),
      dto.scheduledAt,
      dto.duration,
      dto.platform,
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
    let query = 'SELECT * FROM live_classes WHERE school_id = $1';
    const params: any[] = [schoolId];

    if (classId) {
      query += ' AND class_id = $2';
      params.push(classId);
    }

    query += ' ORDER BY scheduled_at DESC';

    return this.databaseService.query(query, params);
  }

  async getLiveClassById(id: number, schoolId: number): Promise<LiveClass> {
    const query = 'SELECT * FROM live_classes WHERE id = $1 AND school_id = $2';
    const result = await this.databaseService.query(query, [id, schoolId]);
    return result[0];
  }

  async startLiveClass(id: number, schoolId: number): Promise<LiveClass> {
    const query = `
      UPDATE live_classes 
      SET status = 'live', started_at = NOW()
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;
    const result = await this.databaseService.query(query, [id, schoolId]);
    return result[0];
  }

  async endLiveClass(
    id: number,
    schoolId: number,
    recordingUrl?: string,
  ): Promise<LiveClass> {
    const query = `
      UPDATE live_classes 
      SET status = 'ended', ended_at = NOW(), recording_url = $3
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;
    const result = await this.databaseService.query(query, [
      id,
      schoolId,
      recordingUrl,
    ]);
    return result[0];
  }

  async deleteLiveClass(id: number, schoolId: number): Promise<void> {
    const query = 'DELETE FROM live_classes WHERE id = $1 AND school_id = $2';
    await this.databaseService.query(query, [id, schoolId]);
  }

  async getUpcomingClasses(schoolId: number): Promise<LiveClass[]> {
    const query = `
      SELECT * FROM live_classes 
      WHERE school_id = $1 
        AND status = 'scheduled' 
        AND scheduled_at > NOW()
      ORDER BY scheduled_at ASC
      LIMIT 10
    `;
    return this.databaseService.query(query, [schoolId]);
  }

  async getLiveNowClasses(schoolId: number): Promise<LiveClass[]> {
    const query = `
      SELECT * FROM live_classes 
      WHERE school_id = $1 AND status = 'live'
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
