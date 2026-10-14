import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EncryptionUtil } from '../utils/encryption.util';

/** PII at rest: identity fields are AES-encrypted (see 014). */
const enc = (v: string | null | undefined): string | null =>
  v ? EncryptionUtil.encrypt(v) : null;
function decGuardian<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  for (const k of ['citizenship_no', 'nin'] as const) {
    if (k in row) {
      const v = row[k] ?? null;
      (row as any)[k] = v ? EncryptionUtil.decrypt(v) : v;
    }
  }
  return row;
}
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

export interface Guardian {
  guardian_id: number;
  school_id: number;
  guardian_code: string;
  user_id?: number | null;
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
  citizenship_no?: string | null;
  citizenship_issue_district?: string | null;
  citizenship_issue_date?: Date | null;
  citizenship_issue_date_bs?: string | null;
  nin?: string | null;
  address_en?: string | null;
  address_np?: string | null;
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

    const created = await this.db.insert<Guardian>(
      `INSERT INTO guardians (school_id, guardian_code, first_name_en, middle_name_en, last_name_en, first_name_np, middle_name_np, last_name_np, display_name, relation_to_student, relation_to_student_np, occupation, occupation_np, education_level, education_level_np, mobile, alternate_mobile, email, annual_income, citizenship_no, citizenship_issue_district, citizenship_issue_date, citizenship_issue_date_bs, nin, address_en, address_np)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
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
        createGuardianDto.relationToStudentNp || null,
        createGuardianDto.occupation || null,
        createGuardianDto.occupationNp || null,
        createGuardianDto.educationLevel || null,
        createGuardianDto.educationLevelNp || null,
        createGuardianDto.mobile,
        createGuardianDto.alternateMobile || null,
        createGuardianDto.email || null,
        createGuardianDto.annualIncome || null,
        enc(createGuardianDto.citizenshipNumber),
        createGuardianDto.citizenshipIssueDistrict || null,
        createGuardianDto.citizenshipIssueDate || null,
        createGuardianDto.citizenshipIssueDateBs || null,
        enc(createGuardianDto.nin),
        createGuardianDto.addressEn || null,
        createGuardianDto.addressNp || null,
      ],
    );
    return decGuardian(created);
  }

  async findAll(schoolId: number): Promise<Guardian[]> {
    const rows = await this.db.query<Guardian>(
      `SELECT * FROM guardians WHERE school_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [schoolId],
    );
    return rows.map(decGuardian);
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

    return decGuardian(guardian);
  }

  async update(
    id: number,
    schoolId: number,
    updateGuardianDto: UpdateGuardianDto,
  ): Promise<Guardian> {
    const existing = await this.findOne(id, schoolId);

    if (
      updateGuardianDto.userId !== undefined &&
      updateGuardianDto.userId !== null
    ) {
      const owner = await this.db.queryOne<{ school_id: number | null }>(
        `SELECT school_id FROM users WHERE user_id = $1`,
        [updateGuardianDto.userId],
      );
      if (!owner) throw new NotFoundException('Linked user not found');
      if (owner.school_id !== null && owner.school_id !== schoolId) {
        throw new BadRequestException('Linked user belongs to another school');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      userId: 'user_id',
      firstNameEn: 'first_name_en',
      middleNameEn: 'middle_name_en',
      lastNameEn: 'last_name_en',
      firstNameNp: 'first_name_np',
      middleNameNp: 'middle_name_np',
      lastNameNp: 'last_name_np',
      relation: 'relation_to_student',
      relationToStudent: 'relation_to_student',
      relationToStudentNp: 'relation_to_student_np',
      occupation: 'occupation',
      occupationNp: 'occupation_np',
      educationLevel: 'education_level',
      educationLevelNp: 'education_level_np',
      mobile: 'mobile',
      alternateMobile: 'alternate_mobile',
      email: 'email',
      annualIncome: 'annual_income',
      citizenshipNumber: 'citizenship_no',
      citizenshipIssueDistrict: 'citizenship_issue_district',
      citizenshipIssueDate: 'citizenship_issue_date',
      citizenshipIssueDateBs: 'citizenship_issue_date_bs',
      nin: 'nin',
      addressEn: 'address_en',
      addressNp: 'address_np',
    };

    // PII at rest: encrypt identity fields on the way in.
    const piiKeys = new Set(['citizenshipNumber', 'nin']);
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateGuardianDto[key as keyof UpdateGuardianDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        const value = updateGuardianDto[key as keyof UpdateGuardianDto];
        params.push(piiKeys.has(key) ? enc(value as string) : value);
      }
    }

    // Keep display_name fresh when any name part changes (same NP-preferred
    // rule as create; plain concatenation, no conversion).
    const guardianNameKeys = [
      'firstNameEn',
      'lastNameEn',
      'firstNameNp',
      'lastNameNp',
    ] as const;
    if (guardianNameKeys.some((k) => updateGuardianDto[k] !== undefined)) {
      const firstNp = updateGuardianDto.firstNameNp ?? existing.first_name_np;
      const lastNp = updateGuardianDto.lastNameNp ?? existing.last_name_np;
      const firstEn = updateGuardianDto.firstNameEn ?? existing.first_name_en;
      const lastEn = updateGuardianDto.lastNameEn ?? existing.last_name_en;
      const display = firstNp
        ? `${firstNp} ${lastNp ?? ''}`.trim()
        : `${firstEn ?? ''} ${lastEn ?? ''}`.trim();
      updates.push(`display_name = $${paramIndex++}`);
      params.push(display);
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
    const guardian = await this.db.queryOne<Guardian>(
      `SELECT * FROM guardians WHERE mobile = $1 AND school_id = $2 AND is_active = true`,
      [mobile, schoolId],
    );
    return guardian ? decGuardian(guardian) : guardian;
  }

  async searchGuardians(schoolId: number, query: string): Promise<Guardian[]> {
    const normalizedQuery = `%${query.toLowerCase()}%`;
    const rows = await this.db.query<Guardian>(
      `SELECT * FROM guardians WHERE school_id = $1 AND is_active = true 
       AND (LOWER(first_name_en) LIKE $2 OR LOWER(last_name_en) LIKE $2 
       OR LOWER(first_name_np) LIKE $2 OR LOWER(last_name_np) LIKE $2 
       OR mobile LIKE $2)
       ORDER BY created_at DESC LIMIT 50`,
      [schoolId, normalizedQuery],
    );
    return rows.map(decGuardian);
  }

  async getGuardianWithDetails(id: number, schoolId: number): Promise<any> {
    return this.findOne(id, schoolId);
  }
}
