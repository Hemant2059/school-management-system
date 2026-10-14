import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

export interface Timetable {
  timetable_id: number;
  school_id: number;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number;
  day_of_week: number;
  day_of_week_np: string | null;
  start_time: string;
  end_time: string;
  period_number: number;
  room_number: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class TimetableService {
  constructor(private db: DatabaseService) {}

  async create(createDto: CreateTimetableDto): Promise<Timetable> {
    const conflict = await this.db.queryOne<Timetable>(
      `SELECT id FROM timetables 
       WHERE school_id = $1 AND class_id = $2 AND (section_id = $3 OR ($3 IS NULL AND section_id IS NULL))
       AND day_of_week = $4 AND period_number = $5 AND is_active = true AND deleted_at IS NULL`,
      [
        createDto.schoolId,
        createDto.classId,
        createDto.sectionId || null,
        String(createDto.dayOfWeek),
        createDto.periodNumber,
      ],
    );

    if (conflict) {
      throw new BadRequestException('Timetable slot already occupied');
    }

    const result = await this.db.insert<Timetable>(
      `INSERT INTO timetables (
        school_id, class_id, section_id, subject_id, teacher_id,
        day_of_week, day_of_week_np, start_time, end_time, period_number, room_number, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.classId,
        createDto.sectionId || null,
        createDto.subjectId || null,
        createDto.teacherId || null,
        String(createDto.dayOfWeek),
        createDto.dayOfWeekNp || null,
        createDto.startTime,
        createDto.endTime,
        createDto.periodNumber,
        createDto.roomNumber || null,
        true,
      ],
    );
    return result;
  }

  async findAll(
    schoolId: number,
    classId: number,
    sectionId?: number,
  ): Promise<Timetable[]> {
    let query = `SELECT * FROM timetables WHERE school_id = $1 AND class_id = $2 AND is_active = true AND deleted_at IS NULL`;
    const params: any[] = [schoolId, classId];

    if (sectionId) {
      params.push(sectionId);
      query += ` AND section_id = $${params.length}`;
    }

    query += ` ORDER BY day_of_week ASC, period_number ASC`;

    return this.db.query<Timetable>(query, params);
  }

  async findOne(id: number, schoolId?: number): Promise<Timetable> {
    let query = `SELECT * FROM timetables WHERE id = $1 AND deleted_at IS NULL`;
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }

    const timetable = await this.db.queryOne<Timetable>(query, params);
    if (!timetable)
      throw new NotFoundException(`Timetable with ID ${id} not found`);
    return timetable;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateTimetableDto,
  ): Promise<Timetable> {
    const timetable = await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields = [
      'class_id',
      'section_id',
      'subject_id',
      'teacher_id',
      'day_of_week',
      'start_time',
      'end_time',
      'period_number',
      'room_number',
    ];

    for (const field of fields) {
      if ((updateDto as any)[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push((updateDto as any)[field]);
        paramIndex++;
      }
    }

    // Nepali twin comes from the frontend — stored verbatim, never derived.
    // day_of_week itself is frontend-supplied (dayOfWeek 0-6), not derived from a date.
    const dayOfWeekNp =
      (updateDto as any).dayOfWeekNp ?? (updateDto as any).day_of_week_np;
    if (dayOfWeekNp !== undefined) {
      updates.push(`day_of_week_np = $${paramIndex}`);
      params.push(dayOfWeekNp || null);
      paramIndex++;
    }

    if (updates.length === 0) return timetable;

    params.push(id);
    await this.db.update(
      `UPDATE timetables SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params,
    );

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE timetables SET is_active = false, deleted_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async getWeeklyTimetable(
    schoolId: number,
    classId: number,
    sectionId?: number,
  ): Promise<any> {
    const timetables = await this.findAll(schoolId, classId, sectionId);
    const weeklySchedule: any[][] = Array.from({ length: 7 }, () => []);

    timetables.forEach((tt) => {
      // day_of_week is varchar in the DB — coerce and guard so a bad value
      // can neither crash getDayName nor pollute the 7-day schedule.
      const day = Number(tt.day_of_week);
      if (!Number.isInteger(day) || day < 0 || day > 6) return;
      weeklySchedule[day].push({
        ...tt,
        dayName: this.getDayName(day, 'en'),
        dayNameNp: this.getDayName(day, 'np'),
      });
    });

    return {
      classId,
      sectionId,
      schedule: weeklySchedule.map((periods, dayIndex) => ({
        dayIndex,
        dayName: this.getDayName(dayIndex, 'en'),
        dayNameNp: this.getDayName(dayIndex, 'np'),
        periods: periods.sort(
          (a: any, b: any) => a.period_number - b.period_number,
        ),
      })),
    };
  }

  private getDayName(dayIndex: number, language: 'en' | 'np'): string {
    const daysEn = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const daysNp = [
      'आइतबार',
      'सोमबार',
      'मंगलबार',
      'बुधबार',
      'बिहिबार',
      'शुक्रबार',
      'शनिबार',
    ];
    return language === 'np' ? daysNp[dayIndex] : daysEn[dayIndex];
  }
}
