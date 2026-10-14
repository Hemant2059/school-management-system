import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PageOptionsDto, Order } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';

export interface TeacherAssignment {
  assignment_id: number;
  school_id: number;
  teacher_id: number;
  academic_year_id: number;
  class_id: number;
  section_id: number | null;
  subject_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Teacher {
  teacher_id: number;
  school_id: number;
  user_id?: number | null;
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

    if (createTeacherDto.userId !== undefined) {
      const owner = await this.db.queryOne<{ school_id: number | null }>(
        `SELECT school_id FROM users WHERE user_id = $1`,
        [createTeacherDto.userId],
      );
      if (!owner) throw new BadRequestException('Linked user not found');
      if (
        owner.school_id !== null &&
        owner.school_id !== createTeacherDto.schoolId
      ) {
        throw new BadRequestException('Linked user belongs to another school');
      }
    }

    const teacher = await this.db.insert<Teacher>(
      `INSERT INTO teachers (school_id, user_id, teacher_code, employee_id, first_name_en, middle_name_en, last_name_en, first_name_np, middle_name_np, last_name_np, display_name, date_of_birth, gender, blood_group, nationality, nationality_np, religion, religion_np, highest_qualification, highest_qualification_np, specialization, specialization_np, university_board, university_board_np, passing_year, teaching_license_number, license_expiry_date, personal_mobile, official_mobile, personal_email, official_email, joining_date, employment_type, employment_type_np, department, department_np, designation_np, marital_status_np, caste_ethnicity_name_np, emergency_contact_relation_np, current_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41)
       RETURNING *`,
      [
        createTeacherDto.schoolId,
        createTeacherDto.userId ?? null,
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
        createTeacherDto.nationalityNp || null,
        createTeacherDto.religion || null,
        createTeacherDto.religionNp || null,
        createTeacherDto.highestQualification || null,
        createTeacherDto.highestQualificationNp || null,
        createTeacherDto.specialization || null,
        createTeacherDto.specializationNp || null,
        createTeacherDto.universityBoard || null,
        createTeacherDto.universityBoardNp || null,
        createTeacherDto.passingYear || null,
        createTeacherDto.teachingLicenseNumber || null,
        createTeacherDto.licenseExpiryDate || null,
        createTeacherDto.personalMobile || null,
        createTeacherDto.officialMobile || null,
        createTeacherDto.personalEmail || null,
        createTeacherDto.officialEmail || null,
        createTeacherDto.joiningDate || null,
        createTeacherDto.employmentType || 'PERMANENT',
        createTeacherDto.employmentTypeNp || null,
        createTeacherDto.department || null,
        createTeacherDto.departmentNp || null,
        createTeacherDto.designationNp || null,
        createTeacherDto.maritalStatusNp || null,
        createTeacherDto.casteEthnicityNameNp || null,
        createTeacherDto.emergencyContactRelationNp || null,
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
    // Never interpolate raw input into ORDER BY.
    const order = pageOptionsDto.order === Order.ASC ? 'ASC' : 'DESC';

    const teachers = await this.db.query<Teacher>(
      `SELECT * FROM teachers WHERE school_id = $1 AND is_active = true ORDER BY created_at ${order} LIMIT $2::int OFFSET $3::int`,
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
    const teacher = await this.findOne(id);

    if (
      updateTeacherDto.userId !== undefined &&
      updateTeacherDto.userId !== null
    ) {
      const owner = await this.db.queryOne<{ school_id: number | null }>(
        `SELECT school_id FROM users WHERE user_id = $1`,
        [updateTeacherDto.userId],
      );
      if (!owner) throw new BadRequestException('Linked user not found');
      if (owner.school_id !== null && owner.school_id !== teacher.school_id) {
        throw new BadRequestException('Linked user belongs to another school');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      userId: 'user_id',
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
      departmentNp: 'department_np',
      designationNp: 'designation_np',
      religionNp: 'religion_np',
      nationalityNp: 'nationality_np',
      highestQualificationNp: 'highest_qualification_np',
      specializationNp: 'specialization_np',
      universityBoardNp: 'university_board_np',
      maritalStatusNp: 'marital_status_np',
      casteEthnicityNameNp: 'caste_ethnicity_name_np',
      emergencyContactRelationNp: 'emergency_contact_relation_np',
      employmentTypeNp: 'employment_type_np',
      currentStatus: 'current_status',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateTeacherDto[key as keyof UpdateTeacherDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateTeacherDto[key as keyof UpdateTeacherDto]);
      }
    }

    // Keep display_name fresh when any name part changes (same NP-preferred
    // rule as create; plain concatenation, no conversion).
    const teacherNameKeys = [
      'firstNameEn',
      'lastNameEn',
      'firstNameNp',
      'lastNameNp',
    ] as const;
    if (teacherNameKeys.some((k) => updateTeacherDto[k] !== undefined)) {
      const firstNp = updateTeacherDto.firstNameNp ?? teacher.first_name_np;
      const lastNp = updateTeacherDto.lastNameNp ?? teacher.last_name_np;
      const firstEn = updateTeacherDto.firstNameEn ?? teacher.first_name_en;
      const lastEn = updateTeacherDto.lastNameEn ?? teacher.last_name_en;
      const display = firstNp
        ? `${firstNp} ${lastNp ?? ''}`.trim()
        : `${firstEn ?? ''} ${lastEn ?? ''}`.trim();
      updates.push(`display_name = $${paramIndex++}`);
      params.push(display);
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

  // ------------------------------------------------------------------
  // Teaching assignments: the grant surface for row-ownership scoping.
  // NULL section_id = all sections of the class; NULL subject_id = all
  // subjects of the class. Only active assignments grant visibility.
  // ------------------------------------------------------------------
  async assignToClass(
    schoolId: number,
    dto: {
      teacherId: number;
      academicYearId: number;
      classId: number;
      sectionId?: number;
      subjectId?: number;
    },
  ): Promise<TeacherAssignment> {
    const teacher = await this.db.queryOne<{ school_id: number }>(
      `SELECT school_id FROM teachers WHERE teacher_id = $1 AND school_id = $2 AND is_active = true`,
      [dto.teacherId, schoolId],
    );
    if (!teacher)
      throw new NotFoundException('Teacher not found in this school');
    const year = await this.db.queryOne<{ academic_year_id: number }>(
      `SELECT academic_year_id FROM academic_years WHERE academic_year_id = $1 AND school_id = $2`,
      [dto.academicYearId, schoolId],
    );
    if (!year)
      throw new NotFoundException('Academic year not found in this school');
    const cls = await this.db.queryOne<{ class_id: number }>(
      `SELECT class_id FROM classes WHERE class_id = $1 AND school_id = $2`,
      [dto.classId, schoolId],
    );
    if (!cls) throw new NotFoundException('Class not found in this school');
    if (dto.sectionId !== undefined) {
      const sec = await this.db.queryOne(
        `SELECT section_id FROM sections WHERE section_id = $1 AND class_id = $2 AND school_id = $3`,
        [dto.sectionId, dto.classId, schoolId],
      );
      if (!sec) throw new NotFoundException('Section not found in this class');
    }
    if (dto.subjectId !== undefined) {
      const subj = await this.db.queryOne(
        `SELECT subject_id FROM subjects WHERE subject_id = $1 AND school_id = $2`,
        [dto.subjectId, schoolId],
      );
      if (!subj)
        throw new NotFoundException('Subject not found in this school');
    }
    return this.db.insert<TeacherAssignment>(
      `INSERT INTO teacher_assignments (school_id, teacher_id, academic_year_id, class_id, section_id, subject_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (teacher_id, academic_year_id, class_id, section_id, subject_id)
       DO UPDATE SET is_active = true, updated_at = NOW()
       RETURNING *`,
      [
        schoolId,
        dto.teacherId,
        dto.academicYearId,
        dto.classId,
        dto.sectionId ?? null,
        dto.subjectId ?? null,
      ],
    );
  }

  async removeAssignment(
    assignmentId: number,
    schoolId: number,
  ): Promise<void> {
    const n = await this.db.update(
      `UPDATE teacher_assignments SET is_active = false, updated_at = NOW()
        WHERE assignment_id = $1 AND school_id = $2`,
      [assignmentId, schoolId],
    );
    if (n === 0) throw new NotFoundException('Assignment not found');
  }

  async listAssignments(schoolId: number, teacherId?: number): Promise<any[]> {
    const params: any[] = [schoolId];
    let query = `SELECT ta.*, c.class_name, sec.section_name, sub.subject_name,
                        ay.session_name AS academic_year
                   FROM teacher_assignments ta
                   JOIN classes c ON c.class_id = ta.class_id
                   LEFT JOIN sections sec ON sec.section_id = ta.section_id
                   LEFT JOIN subjects sub ON sub.subject_id = ta.subject_id
                   JOIN academic_years ay ON ay.academic_year_id = ta.academic_year_id
                  WHERE ta.school_id = $1 AND ta.is_active = true`;
    if (teacherId !== undefined) {
      params.push(teacherId);
      query += ` AND ta.teacher_id = $${params.length}`;
    }
    query += ` ORDER BY ay.session_name DESC, c.class_order, sec.section_name`;
    return this.db.query(query, params);
  }
}
