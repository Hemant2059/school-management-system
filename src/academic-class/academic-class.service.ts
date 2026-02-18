import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';

export interface AcademicClass {
  class_id: number;
  school_id: number;
  class_name: string;
  class_code: string;
  class_order: number;
  education_level: string;
  min_age: number | null;
  max_age: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class AcademicClassService {
  constructor(private db: DatabaseService) {}

  async create(createDto: CreateAcademicClassDto): Promise<AcademicClass> {
    const existing = await this.db.queryOne<AcademicClass>(
      `SELECT * FROM classes WHERE class_code = $1 AND school_id = $2 AND is_active = true`,
      [createDto.classCode, createDto.schoolId],
    );

    if (existing) {
      throw new BadRequestException(
        `Class code ${createDto.classCode} already exists in this school`,
      );
    }

    return this.db.insert<AcademicClass>(
      `INSERT INTO classes (school_id, class_name, class_code, class_order, education_level, min_age, max_age, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.className,
        createDto.classCode,
        createDto.classOrder,
        createDto.educationLevel,
        createDto.minAge || null,
        createDto.maxAge || null,
      ],
    );
  }

  async findAll(schoolId: number): Promise<AcademicClass[]> {
    return this.db.query<AcademicClass>(
      `SELECT * FROM classes WHERE school_id = $1 AND is_active = true ORDER BY class_order ASC`,
      [schoolId],
    );
  }

  async findOne(id: number, schoolId?: number): Promise<AcademicClass> {
    const academicClass = await this.db.queryOne<AcademicClass>(
      schoolId
        ? `SELECT * FROM classes WHERE class_id = $1 AND school_id = $2 AND is_active = true`
        : `SELECT * FROM classes WHERE class_id = $1 AND is_active = true`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!academicClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return academicClass;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateAcademicClassDto,
  ): Promise<AcademicClass> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      className: 'class_name',
      classOrder: 'class_order',
      educationLevel: 'education_level',
      minAge: 'min_age',
      maxAge: 'max_age',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateAcademicClassDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateAcademicClassDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE classes SET ${updates.join(', ')}, updated_at = NOW() WHERE class_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE classes SET is_active = false, deleted_at = NOW() WHERE class_id = $1`,
      [id],
    );
  }

  async getClassesByLevel(
    schoolId: number,
    level: string,
  ): Promise<AcademicClass[]> {
    return this.db.query<AcademicClass>(
      `SELECT * FROM classes WHERE school_id = $1 AND education_level = $2 AND is_active = true ORDER BY class_order ASC`,
      [schoolId, level],
    );
  }

  async findBySchoolAndCode(
    schoolId: number,
    classCode: string,
  ): Promise<AcademicClass> {
    const academicClass = await this.db.queryOne<AcademicClass>(
      `SELECT * FROM classes WHERE school_id = $1 AND class_code = $2 AND is_active = true`,
      [schoolId, classCode],
    );

    if (!academicClass) {
      throw new NotFoundException(`Class with code ${classCode} not found`);
    }

    return academicClass;
  }
}
