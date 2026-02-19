import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';

export interface Teacher {
  teacher_id: number;
  school_id: number;
  teacher_code: string;
  employee_id: string;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  display_name: string | null;
  date_of_birth: Date | null;
  date_of_birth_bs: string | null;
  gender: string;
  blood_group: string | null;
  nationality: string | null;
  religion: string | null;
  highest_qualification: string | null;
  specialization: string | null;
  university_board: string | null;
  passing_year: number | null;
  teaching_license_number: string | null;
  license_expiry_date: Date | null;
  personal_mobile: string | null;
  official_mobile: string | null;
  personal_email: string | null;
  official_email: string | null;
  joining_date: Date | null;
  joining_date_bs: string | null;
  employment_type: string | null;
  department: string | null;
  designation: string | null;
  current_status: string;
  is_active: boolean;
  citizenship_number: string | null;
  citizenship_issue_district: string | null;
  citizenship_issue_date: Date | null;
  citizenship_issue_date_bs: string | null;
  pan_number: string | null;
  ssf_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  caste_ethnicity_code: string | null;
  caste_ethnicity_name: string | null;
  marital_status: string | null;
  profile_photo_url: string | null;
  permanent_province_id: number | null;
  permanent_district_id: number | null;
  permanent_municipality_id: number | null;
  permanent_ward_no: number | null;
  permanent_tole_en: string | null;
  permanent_address_en: string | null;
  permanent_tole_np: string | null;
  permanent_address_np: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class TeacherService {
  constructor(private db: DatabaseService) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    const existing = await this.db.queryOne<Teacher>(
      `SELECT * FROM teachers WHERE employee_id = $1 AND school_id = $2 AND is_active = true`,
      [createTeacherDto.employeeId, createTeacherDto.schoolId],
    );

    if (existing) {
      throw new BadRequestException(
        'Teacher with this employee ID already exists',
      );
    }

    const [countResult] = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM teachers WHERE school_id = $1`,
      [createTeacherDto.schoolId],
    );
    const count = parseInt(countResult.count, 10);
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const teacherCode = `TCH-${yearSuffix}-${String(count + 1).padStart(5, '0')}`;

    const displayName = createTeacherDto.firstNameNp
      ? `${createTeacherDto.firstNameNp} ${createTeacherDto.lastNameNp ?? ''}`.trim()
      : `${createTeacherDto.firstNameEn} ${createTeacherDto.lastNameEn ?? ''}`.trim();

    const teacher = await this.db.insert<Teacher>(
      `INSERT INTO teachers (school_id, teacher_code, employee_id, first_name_en, middle_name_en, last_name_en, first_name_np, middle_name_np, last_name_np, display_name, date_of_birth, gender, blood_group, nationality, religion, highest_qualification, specialization, university_board, passing_year, teaching_license_number, license_expiry_date, personal_mobile, official_mobile, personal_email, official_email, joining_date, employment_type, department, current_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
       RETURNING *`,
      [
        createTeacherDto.schoolId,
        teacherCode,
        createTeacherDto.employeeId,
        createTeacherDto.firstNameEn,
        createTeacherDto.middleNameEn || null,
        createTeacherDto.lastNameEn,
        createTeacherDto.firstNameNp,
        createTeacherDto.middleNameNp || null,
        createTeacherDto.lastNameNp,
        displayName,
        createTeacherDto.dateOfBirth || null,
        createTeacherDto.gender,
        createTeacherDto.bloodGroup || null,
        createTeacherDto.nationality || null,
        createTeacherDto.religion || null,
        createTeacherDto.highestQualification || null,
        createTeacherDto.specialization || null,
        createTeacherDto.universityBoard || null,
        createTeacherDto.passingYear || null,
        createTeacherDto.teachingLicenseNumber || null,
        createTeacherDto.licenseExpiryDate || null,
        createTeacherDto.personalMobile || null,
        createTeacherDto.officialMobile || null,
        createTeacherDto.personalEmail || null,
        createTeacherDto.officialEmail || null,
        createTeacherDto.joiningDate || null,
        createTeacherDto.employmentType || 'PERMANENT',
        createTeacherDto.department || null,
        createTeacherDto.currentStatus || 'ACTIVE',
      ],
    );

    return teacher;
  }

  async findAll(
    schoolId: number,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Teacher>> {
    const page = pageOptionsDto.page || 1;
    const take = pageOptionsDto.take || 10;
    const offset = (page - 1) * take;
    const order = pageOptionsDto.order || 'DESC';

    const teachers = await this.db.query<Teacher>(
      `SELECT * FROM teachers WHERE school_id = $1 AND is_active = true ORDER BY created_at ${order} LIMIT $2 OFFSET $3`,
      [schoolId, take, offset],
    );

    const [countResult] = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM teachers WHERE school_id = $1 AND is_active = true`,
      [schoolId],
    );

    const itemCount = parseInt(countResult.count, 10);
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(teachers, pageMetaDto);
  }

  async findOne(id: number): Promise<Teacher> {
    const teacher = await this.db.queryOne<Teacher>(
      `SELECT * FROM teachers WHERE teacher_id = $1 AND is_active = true`,
      [id],
    );

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByEmployeeId(employeeId: string): Promise<Teacher> {
    const teacher = await this.db.queryOne<Teacher>(
      `SELECT * FROM teachers WHERE employee_id = $1 AND is_active = true`,
      [employeeId],
    );

    if (!teacher) {
      throw new NotFoundException(
        `Teacher with employee ID ${employeeId} not found`,
      );
    }

    return teacher;
  }

  async update(
    id: number,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<Teacher> {
    await this.findOne(id);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      firstNameEn: 'first_name_en',
      lastNameEn: 'last_name_en',
      firstNameNp: 'first_name_np',
      lastNameNp: 'last_name_np',
      gender: 'gender',
      personalMobile: 'personal_mobile',
      officialMobile: 'official_mobile',
      personalEmail: 'personal_email',
      officialEmail: 'official_email',
      department: 'department',
      currentStatus: 'current_status',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateTeacherDto[key as keyof UpdateTeacherDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateTeacherDto[key as keyof UpdateTeacherDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE teachers SET ${updates.join(', ')}, updated_at = NOW() WHERE teacher_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.db.query(
      `UPDATE teachers SET is_active = false, deleted_at = NOW() WHERE teacher_id = $1`,
      [id],
    );
  }

  async searchTeachers(schoolId: number, query: string): Promise<Teacher[]> {
    const normalizedQuery = `%${query.toLowerCase()}%`;

    return this.db.query<Teacher>(
      `SELECT * FROM teachers WHERE school_id = $1 AND is_active = true 
       AND (LOWER(first_name_en) LIKE $2 OR LOWER(last_name_en) LIKE $2 
       OR LOWER(first_name_np) LIKE $2 OR LOWER(last_name_np) LIKE $2 
       OR employee_id LIKE $2)
       ORDER BY created_at DESC LIMIT 50`,
      [schoolId, normalizedQuery],
    );
  }

  async getTeacherWithDetails(id: number): Promise<any> {
    return this.findOne(id);
  }
}
