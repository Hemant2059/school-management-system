import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface AcademicCalendar {
  id: number;
  school_id: number;
  academic_year: string;
  title: string;
  title_np: string | null;
  event_type: string;
  start_date: Date;
  end_date: Date | null;
  start_date_bs: string | null;
  end_date_bs: string | null;
  description: string | null;
  description_np: string | null;
  is_holiday: boolean;
  is_exam: boolean;
  is_event: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCalendarEventDto {
  schoolId: number;
  academicYear: string;
  title: string;
  titleNp?: string;
  eventType: string;
  startDate: string;
  startDateBs?: string;
  endDate?: string;
  endDateBs?: string;
  description?: string;
  descriptionNp?: string;
  isHoliday?: boolean;
  isExam?: boolean;
  isEvent?: boolean;
  createdBy?: number;
}

@Injectable()
export class AcademicCalendarService {
  constructor(private db: DatabaseService) {}

  async create(dto: CreateCalendarEventDto): Promise<AcademicCalendar> {
    return this.db.insert<AcademicCalendar>(
      `INSERT INTO academic_calendars (school_id, academic_year, title, title_np, event_type, start_date, start_date_bs, end_date, end_date_bs, description, description_np, is_holiday, is_exam, is_event, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15)
       RETURNING *`,
      [
        dto.schoolId,
        dto.academicYear,
        dto.title,
        dto.titleNp || null,
        dto.eventType,
        dto.startDate,
        dto.startDateBs || null,
        dto.endDate || null,
        dto.endDateBs || null,
        dto.description || null,
        dto.descriptionNp || null,
        dto.isHoliday || false,
        dto.isExam || false,
        dto.isEvent || false,
        dto.createdBy || null,
      ],
    );
  }

  async findAll(
    schoolId: number,
    academicYear?: string,
  ): Promise<AcademicCalendar[]> {
    let query = `SELECT * FROM academic_calendars WHERE school_id = $1 AND is_active = true`;
    const params: any[] = [schoolId];

    if (academicYear) {
      query += ` AND academic_year = $2`;
      params.push(academicYear);
    }

    query += ` ORDER BY start_date ASC`;

    return this.db.query(query, params);
  }

  async findById(id: number, schoolId: number): Promise<AcademicCalendar> {
    const event = await this.db.queryOne<AcademicCalendar>(
      `SELECT * FROM academic_calendars WHERE id = $1 AND school_id = $2 AND is_active = true`,
      [id, schoolId],
    );

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return event;
  }

  async update(
    id: number,
    schoolId: number,
    dto: Partial<CreateCalendarEventDto>,
  ): Promise<AcademicCalendar> {
    await this.findById(id, schoolId);

    await this.db.query(
      `UPDATE academic_calendars SET 
        title = COALESCE($2, title),
        title_np = COALESCE($3, title_np),
        event_type = COALESCE($4, event_type),
        academic_year = COALESCE($5, academic_year),
        start_date = COALESCE($6, start_date),
        start_date_bs = COALESCE($7, start_date_bs),
        end_date = COALESCE($8, end_date),
        end_date_bs = COALESCE($9, end_date_bs),
        description = COALESCE($10, description),
        description_np = COALESCE($11, description_np),
        is_holiday = COALESCE($12, is_holiday),
        is_exam = COALESCE($13, is_exam),
        is_event = COALESCE($14, is_event),
        updated_at = NOW()
       WHERE id = $1 AND school_id = $15`,
      [
        id,
        dto.title ?? null,
        dto.titleNp ?? null,
        dto.eventType ?? null,
        dto.academicYear ?? null,
        dto.startDate ?? null,
        dto.startDateBs ?? null,
        dto.endDate ?? null,
        dto.endDateBs ?? null,
        dto.description ?? null,
        dto.descriptionNp ?? null,
        dto.isHoliday ?? null,
        dto.isExam ?? null,
        dto.isEvent ?? null,
        schoolId,
      ],
    );

    return this.findById(id, schoolId);
  }

  async delete(id: number, schoolId: number): Promise<void> {
    await this.findById(id, schoolId);

    await this.db.query(
      `UPDATE academic_calendars SET is_active = false, updated_at = NOW() WHERE id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }

  async getHolidays(
    schoolId: number,
    academicYear: string,
  ): Promise<AcademicCalendar[]> {
    return this.db.query<AcademicCalendar>(
      `SELECT * FROM academic_calendars 
       WHERE school_id = $1 AND academic_year = $2 AND is_holiday = true AND is_active = true
       ORDER BY start_date ASC`,
      [schoolId, academicYear],
    );
  }

  async getExams(
    schoolId: number,
    academicYear: string,
  ): Promise<AcademicCalendar[]> {
    return this.db.query<AcademicCalendar>(
      `SELECT * FROM academic_calendars 
       WHERE school_id = $1 AND academic_year = $2 AND is_exam = true AND is_active = true
       ORDER BY start_date ASC`,
      [schoolId, academicYear],
    );
  }

  async getEvents(
    schoolId: number,
    academicYear: string,
  ): Promise<AcademicCalendar[]> {
    return this.db.query<AcademicCalendar>(
      `SELECT * FROM academic_calendars 
       WHERE school_id = $1 AND academic_year = $2 AND is_event = true AND is_active = true
       ORDER BY start_date ASC`,
      [schoolId, academicYear],
    );
  }

  async getCalendarByDateRange(
    schoolId: number,
    startDate: string,
    endDate: string,
  ): Promise<AcademicCalendar[]> {
    return this.db.query<AcademicCalendar>(
      `SELECT * FROM academic_calendars 
       WHERE school_id = $1 AND is_active = true 
       AND (start_date >= $2 AND start_date <= $3)
       ORDER BY start_date ASC`,
      [schoolId, startDate, endDate],
    );
  }

  async getUpcoming(
    schoolId: number,
    days: number | string = 30,
  ): Promise<AcademicCalendar[]> {
    let n = parseInt(String(days), 10);
    if (!Number.isFinite(n) || n < 1) n = 30;
    n = Math.min(n, 365);
    return this.db.query<AcademicCalendar>(
      `SELECT * FROM academic_calendars 
       WHERE school_id = $1 AND is_active = true 
       AND start_date >= CURRENT_DATE AND start_date <= CURRENT_DATE + make_interval(days => $2::int)
       ORDER BY start_date ASC`,
      [schoolId, n],
    );
  }
}
