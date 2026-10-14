import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';

export interface Assignment {
  id: number;
  school_id: number;
  title: string | null;
  title_np: string | null;
  description: string;
  description_np: string | null;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number;
  due_date: Date;
  due_date_bs: string | null;
  total_marks: number;
  is_published: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class AssignmentService {
  constructor(private db: DatabaseService) {}

  async create(createDto: CreateAssignmentDto): Promise<Assignment> {
    // BS date comes from the frontend — the backend stores it as given.
    const bsDate = createDto.dueDateBs || null;

    const result = await this.db.insert<Assignment>(
      `INSERT INTO assignments (
        school_id, title, title_np, description, description_np, class_id, section_id, subject_id,
        teacher_id, due_date, due_date_bs, total_marks, is_published, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.title || createDto.description,
        createDto.titleNp || null,
        createDto.description,
        createDto.descriptionNp || null,
        createDto.classId,
        createDto.sectionId,
        createDto.subjectId,
        createDto.teacherId,
        createDto.dueDate,
        bsDate,
        createDto.totalMarks || 100,
        false,
        true,
      ],
    );
    return result;
  }

  async findAll(
    schoolId: number,
    classId: number,
    subjectId?: number,
  ): Promise<Assignment[]> {
    let query = `SELECT * FROM assignments WHERE school_id = $1 AND class_id = $2 AND is_active = true AND deleted_at IS NULL`;
    const params: any[] = [schoolId, classId];

    if (subjectId) {
      params.push(subjectId);
      query += ` AND subject_id = $${params.length}`;
    }

    query += ` ORDER BY due_date DESC`;

    return this.db.query<Assignment>(query, params);
  }

  async findOne(id: number, schoolId?: number): Promise<Assignment> {
    let query = `SELECT * FROM assignments WHERE id = $1 AND deleted_at IS NULL`;
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }

    const assignment = await this.db.queryOne<Assignment>(query, params);
    if (!assignment)
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    return assignment;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    const assignment = await this.findOne(id, schoolId);

    // BS date comes from the frontend — the backend stores it as given.
    // If the AD due date changes without a BS value, clear the stale twin
    // rather than silently deriving a possibly wrong one.
    let dueDateBs: string | null = assignment.due_date_bs;
    let bsChanged = false;
    if (updateDto.dueDateBs !== undefined) {
      dueDateBs = updateDto.dueDateBs ?? null;
      bsChanged = dueDateBs !== assignment.due_date_bs;
    } else if (
      updateDto.dueDate &&
      new Date(updateDto.dueDate).getTime() !==
        new Date(assignment.due_date).getTime()
    ) {
      dueDateBs = null;
      bsChanged = assignment.due_date_bs !== null;
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // DTO keys are camelCase — map them to snake_case columns.
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      classId: 'class_id',
      sectionId: 'section_id',
      subjectId: 'subject_id',
      teacherId: 'teacher_id',
      dueDate: 'due_date',
      totalMarks: 'total_marks',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      const value = (updateDto as any)[key];
      if (value !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(value ?? null);
        paramIndex++;
      }
    }

    if (bsChanged) {
      updates.push(`due_date_bs = $${paramIndex}`);
      params.push(dueDateBs);
      paramIndex++;
    }

    // Nepali twins come from the frontend — stored verbatim, never derived.
    const npFieldMap: Record<string, string> = {
      titleNp: 'title_np',
      descriptionNp: 'description_np',
    };
    for (const [key, dbField] of Object.entries(npFieldMap)) {
      const value = (updateDto as any)[key];
      if (value !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(value || null);
        paramIndex++;
      }
    }

    if (updates.length === 0) return assignment;

    updates.push(`updated_at = NOW()`);
    params.push(id, schoolId);
    await this.db.update(
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = $${paramIndex} AND school_id = $${paramIndex + 1}`,
      params,
    );

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE assignments SET is_active = false, deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }

  async publishAssignment(id: number, schoolId: number): Promise<Assignment> {
    await this.findOne(id, schoolId);
    await this.db.update(
      `UPDATE assignments SET is_published = true, updated_at = NOW() WHERE id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    return this.findOne(id, schoolId);
  }

  async getAssignmentsByNepaliMonth(
    schoolId: number,
    nepaliYear: number,
    nepaliMonth: number,
  ): Promise<Assignment[]> {
    // End-exclusive window: 1st of the BS month .. 1st of the next BS month,
    // converted to AD for the query (all date math uses AD columns).
    const nextMonth = nepaliMonth === 12 ? 1 : nepaliMonth + 1;
    const nextYear = nepaliMonth === 12 ? nepaliYear + 1 : nepaliYear;
    const startDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-01`;
    const endDateBs = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const startDateAd = NepaliDateUtil.bsToAd(startDateBs);
    const endDateAd = NepaliDateUtil.bsToAd(endDateBs);

    return this.db.query<Assignment>(
      `SELECT * FROM assignments 
       WHERE school_id = $1 AND due_date >= $2 AND due_date < $3 
       AND is_active = true AND deleted_at IS NULL
       ORDER BY due_date ASC`,
      [schoolId, startDateAd, endDateAd],
    );
  }
}
