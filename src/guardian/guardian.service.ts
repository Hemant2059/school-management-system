import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

export interface Guardian {
  guardian_id: number;
  school_id: number;
  guardian_code: string;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  display_name: string | null;
  relation_to_student: string;
  occupation: string | null;
  education_level: string | null;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  annual_income: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class GuardianService {
  constructor(private db: DatabaseService) {}

  async create(createGuardianDto: CreateGuardianDto): Promise<Guardian> {
    const existing = await this.db.queryOne<Guardian>(
      `SELECT * FROM guardians WHERE mobile = $1 AND school_id = $2 AND is_active = true`,
      [createGuardianDto.mobile, createGuardianDto.schoolId],
    );

    if (existing) {
      throw new BadRequestException(
        'Guardian with this mobile number already exists',
      );
    }

    const [countResult] = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM guardians WHERE school_id = $1`,
      [createGuardianDto.schoolId],
    );
    const count = parseInt(countResult.count, 10);
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const guardianCode = `GRD-${yearSuffix}-${String(count + 1).padStart(5, '0')}`;

    const displayName = createGuardianDto.firstNameNp
      ? `${createGuardianDto.firstNameNp} ${createGuardianDto.lastNameNp ?? ''}`.trim()
      : `${createGuardianDto.firstNameEn} ${createGuardianDto.lastNameEn ?? ''}`.trim();

    return this.db.insert<Guardian>(
      `INSERT INTO guardians (school_id, guardian_code, first_name_en, middle_name_en, last_name_en, first_name_np, middle_name_np, last_name_np, display_name, relation_to_student, occupation, education_level, mobile, alternate_mobile, email, annual_income)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        createGuardianDto.schoolId,
        guardianCode,
        createGuardianDto.firstNameEn,
        createGuardianDto.middleNameEn || null,
        createGuardianDto.lastNameEn,
        createGuardianDto.firstNameNp,
        createGuardianDto.middleNameNp || null,
        createGuardianDto.lastNameNp,
        displayName,
        createGuardianDto.relationToStudent,
        createGuardianDto.occupation || null,
        createGuardianDto.educationLevel || null,
        createGuardianDto.mobile,
        createGuardianDto.alternateMobile || null,
        createGuardianDto.email || null,
        createGuardianDto.annualIncome || null,
      ],
    );
  }

  async findAll(schoolId: number): Promise<Guardian[]> {
    return this.db.query<Guardian>(
      `SELECT * FROM guardians WHERE school_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [schoolId],
    );
  }

  async findOne(id: number, schoolId?: number): Promise<Guardian> {
    const guardian = await this.db.queryOne<Guardian>(
      schoolId
        ? `SELECT * FROM guardians WHERE guardian_id = $1 AND school_id = $2 AND is_active = true`
        : `SELECT * FROM guardians WHERE guardian_id = $1 AND is_active = true`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!guardian) {
      throw new NotFoundException(`Guardian with ID ${id} not found`);
    }

    return guardian;
  }

  async update(
    id: number,
    schoolId: number,
    updateGuardianDto: UpdateGuardianDto,
  ): Promise<Guardian> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      firstNameEn: 'first_name_en',
      lastNameEn: 'last_name_en',
      firstNameNp: 'first_name_np',
      lastNameNp: 'last_name_np',
      relation: 'relation',
      occupation: 'occupation',
      mobile: 'mobile',
      alternateMobile: 'alternate_mobile',
      email: 'email',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateGuardianDto[key as keyof UpdateGuardianDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateGuardianDto[key as keyof UpdateGuardianDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE guardians SET ${updates.join(', ')}, updated_at = NOW() WHERE guardian_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE guardians SET is_active = false, deleted_at = NOW() WHERE guardian_id = $1`,
      [id],
    );
  }

  async findByMobile(
    mobile: string,
    schoolId: number,
  ): Promise<Guardian | null> {
    return this.db.queryOne<Guardian>(
      `SELECT * FROM guardians WHERE mobile = $1 AND school_id = $2 AND is_active = true`,
      [mobile, schoolId],
    );
  }

  async searchGuardians(schoolId: number, query: string): Promise<Guardian[]> {
    const normalizedQuery = `%${query.toLowerCase()}%`;
    return this.db.query<Guardian>(
      `SELECT * FROM guardians WHERE school_id = $1 AND is_active = true 
       AND (LOWER(first_name_en) LIKE $2 OR LOWER(last_name_en) LIKE $2 
       OR LOWER(first_name_np) LIKE $2 OR LOWER(last_name_np) LIKE $2 
       OR mobile LIKE $2)
       ORDER BY created_at DESC LIMIT 50`,
      [schoolId, normalizedQuery],
    );
  }

  async getGuardianWithDetails(id: number, schoolId: number): Promise<any> {
    return this.findOne(id, schoolId);
  }
}
