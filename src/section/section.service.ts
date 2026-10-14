import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

export interface Section {
  section_id: number;
  school_id: number;
  class_id: number;
  section_name: string;
  section_code: string;
  section_order: number;
  capacity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class SectionService {
  constructor(private db: DatabaseService) {}

  async create(createDto: CreateSectionDto): Promise<Section> {
    const existing = await this.db.queryOne<Section>(
      `SELECT * FROM sections WHERE section_code = $1 AND class_id = $2 AND school_id = $3 AND is_active = true`,
      [createDto.sectionCode, createDto.classId, createDto.schoolId],
    );

    if (existing) {
      throw new BadRequestException(
        `Section ${createDto.sectionCode} already exists in this class`,
      );
    }

    return this.db.insert<Section>(
      `INSERT INTO sections (school_id, class_id, section_name, section_code, section_order, capacity, section_name_np, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.classId,
        createDto.sectionName,
        createDto.sectionCode,
        createDto.sectionOrder ?? 0,
        createDto.capacity ?? 40,
        createDto.sectionNameNp || null,
      ],
    );
  }

  async findAll(schoolId: number, classId?: number): Promise<Section[]> {
    if (classId) {
      return this.db.query<Section>(
        `SELECT * FROM sections WHERE school_id = $1 AND class_id = $2 AND is_active = true ORDER BY section_order ASC`,
        [schoolId, classId],
      );
    }
    return this.db.query<Section>(
      `SELECT * FROM sections WHERE school_id = $1 AND is_active = true ORDER BY section_order ASC`,
      [schoolId],
    );
  }

  async findOne(id: number, schoolId?: number): Promise<Section> {
    const section = await this.db.queryOne<Section>(
      schoolId
        ? `SELECT * FROM sections WHERE section_id = $1 AND school_id = $2 AND is_active = true`
        : `SELECT * FROM sections WHERE section_id = $1 AND is_active = true`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateSectionDto,
  ): Promise<Section> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      sectionName: 'section_name',
      sectionNameNp: 'section_name_np',
      sectionOrder: 'section_order',
      capacity: 'capacity',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateSectionDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateSectionDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id, schoolId);
      await this.db.query(
        `UPDATE sections SET ${updates.join(', ')}, updated_at = NOW() WHERE section_id = $${paramIndex} AND school_id = $${paramIndex + 1}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE sections SET is_active = false, deleted_at = NOW() WHERE section_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }
}
