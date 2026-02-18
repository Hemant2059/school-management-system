import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { GOVT_FREE_SEAT_QUOTA_PERCENT } from '../common/constants/nepal.constants';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { GetStudentsDto } from './dto/get-students.dto';

export interface Student {
  student_id: number;
  school_id: number;
  student_code: string;
  admission_number: string;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  display_name: string | null;
  gender: string;
  date_of_birth_ad: Date | null;
  date_of_birth_bs: string | null;
  dob_bs_snapshot: string | null;
  student_email: string | null;
  student_mobile: string | null;
  current_status: string;
  is_active: boolean;
  is_govt_mandated_free_seat: boolean;
  is_economically_disadvantaged: boolean;
  caste_ethnicity_code: string | null;
  caste_ethnicity: string | null;
  citizenship_number: string | null;
  birth_certificate_number: string | null;
  blood_group: string | null;
  religion: string | null;
  mother_tongue: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  profile_photo_url: string | null;
  permanent_province_id: number | null;
  permanent_district_id: number | null;
  permanent_municipality_id: number | null;
  permanent_ward_no: number | null;
  permanent_tole_en: string | null;
  permanent_address_en: string | null;
  permanent_tole_np: string | null;
  permanent_address_np: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class StudentService {
  constructor(private db: DatabaseService) {}

  async create(
    createStudentDto: CreateStudentDto,
    userId: number = 1,
  ): Promise<Student> {
    try {
      const existing = await this.db.queryOne<Student>(
        `SELECT * FROM students WHERE admission_number = $1 AND school_id = $2 AND is_active = true`,
        [createStudentDto.admissionNumber, createStudentDto.schoolId],
      );

      if (existing) {
        throw new BadRequestException(
          'Student with this admission number already exists in this school',
        );
      }

      if (createStudentDto.isGovtMandatedFreeSeat) {
        const [totalResult, freeSeatResult] = await Promise.all([
          this.db.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
            [createStudentDto.schoolId],
          ),
          this.db.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE' AND is_govt_mandated_free_seat = true`,
            [createStudentDto.schoolId],
          ),
        ]);

        const total = parseInt(totalResult[0]?.count || '0', 10);
        const freeSeatCount = parseInt(freeSeatResult[0]?.count || '0', 10);
        const newTotal = total + 1;
        const newFreeCount = freeSeatCount + 1;
        const maxAllowed = Math.floor(
          (newTotal * GOVT_FREE_SEAT_QUOTA_PERCENT) / 100,
        );

        if (newFreeCount > maxAllowed) {
          throw new BadRequestException(
            `Government-mandated free seats cannot exceed ${GOVT_FREE_SEAT_QUOTA_PERCENT}% of total students. ` +
              `Current: ${freeSeatCount} free / ${total} total; max allowed for ${newTotal} students is ${maxAllowed}.`,
          );
        }
      }

      const schoolIdStr = String(createStudentDto.schoolId).padStart(3, '0');
      const [countResult] = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM students WHERE school_id = $1`,
        [createStudentDto.schoolId],
      );
      const count = parseInt(countResult.count, 10);
      const yearSuffix = new Date().getFullYear().toString();
      const studentCode = `STU-${yearSuffix}-${schoolIdStr}-${String(count + 1).padStart(4, '0')}`;

      let dateOfBirthBs = createStudentDto.dateOfBirthBs;
      if (!dateOfBirthBs && createStudentDto.dateOfBirthAd) {
        dateOfBirthBs = NepaliDateUtil.adToBs(
          createStudentDto.dateOfBirthAd,
        ).bsDate;
      }

      const displayName = createStudentDto.firstNameNp
        ? `${createStudentDto.firstNameNp} ${createStudentDto.lastNameNp || ''}`.trim()
        : `${createStudentDto.firstNameEn} ${createStudentDto.lastNameEn || ''}`.trim();

      const student = await this.db.insert<Student>(
        `INSERT INTO students (
        school_id, student_code, admission_number, 
        admission_date, admission_class_id,
        first_name_en, middle_name_en, last_name_en, 
        first_name_np, middle_name_np, last_name_np, display_name, 
        gender, date_of_birth_ad, date_of_birth_bs, dob_bs_snapshot,
        student_email, student_mobile, 
        current_status, is_active, is_govt_mandated_free_seat, is_economically_disadvantaged,
        caste_ethnicity_code, caste_ethnicity, citizenship_number, birth_certificate_number,
        blood_group, religion, mother_tongue,
        permanent_province_id, permanent_district_id, permanent_municipality_id, permanent_ward_no,
        permanent_tole_en, permanent_address_en, permanent_tole_np, permanent_address_np,
        temporary_province_id, temporary_district_id, temporary_municipality_id, temporary_ward_no,
        temporary_tole_en, temporary_address_en, temporary_tole_np, temporary_address_np,
        created_by, updated_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47)
       RETURNING *`,
        [
          createStudentDto.schoolId,
          studentCode,
          createStudentDto.admissionNumber,
          createStudentDto.admissionDate || new Date(),
          createStudentDto.admissionClassId || 1,
          createStudentDto.firstNameEn,
          createStudentDto.middleNameEn || null,
          createStudentDto.lastNameEn,
          createStudentDto.firstNameNp || null,
          createStudentDto.middleNameNp || null,
          createStudentDto.lastNameNp || null,
          displayName,
          createStudentDto.gender,
          createStudentDto.dateOfBirthAd || null,
          dateOfBirthBs || null,
          dateOfBirthBs || null,
          createStudentDto.studentEmail || null,
          createStudentDto.studentMobile || null,
          createStudentDto.currentStatus || 'ACTIVE',
          true,
          createStudentDto.isGovtMandatedFreeSeat || false,
          false,
          createStudentDto.casteEthnicity || null,
          createStudentDto.casteEthnicity || null,
          null,
          null,
          createStudentDto.bloodGroup || null,
          createStudentDto.religion || null,
          createStudentDto.motherTongue || null,
          createStudentDto.permanentProvinceId || null,
          createStudentDto.permanentDistrictId || null,
          createStudentDto.permanentMunicipalityId || null,
          createStudentDto.permanentWardNo || null,
          createStudentDto.permanentToleEn || null,
          createStudentDto.permanentAddressEn || null,
          createStudentDto.permanentToleNp || null,
          createStudentDto.permanentAddressNp || null,
          createStudentDto.temporaryProvinceId || null,
          createStudentDto.temporaryDistrictId || null,
          createStudentDto.temporaryMunicipalityId || null,
          createStudentDto.temporaryWardNo || null,
          createStudentDto.temporaryToleEn || null,
          createStudentDto.temporaryAddressEn || null,
          createStudentDto.temporaryToleNp || null,
          createStudentDto.temporaryAddressNp || null,
          userId,
          userId,
        ],
      );

      return student;
    } catch (error) {
      console.error('Student creation error:', error);
      throw error;
    }
  }

  async findAll(
    schoolId: number,
    getStudentsDto: GetStudentsDto,
  ): Promise<PageDto<Student>> {
    const params: any[] = [schoolId];
    let query = `
      SELECT s.*, 
             e.class_id, e.section_id, e.roll_number, e.academic_year
      FROM students s
      LEFT JOIN student_enrollments e ON s.student_id = e.student_id AND e.school_id = s.school_id
      WHERE s.school_id = $1 AND s.is_active = true
    `;

    if (getStudentsDto.gender) {
      params.push(getStudentsDto.gender);
      query += ` AND s.gender = $${params.length}`;
    }

    if (getStudentsDto.currentStatus) {
      params.push(getStudentsDto.currentStatus);
      query += ` AND s.current_status = $${params.length}`;
    }

    if (getStudentsDto.academicYear) {
      params.push(getStudentsDto.academicYear);
      query += ` AND e.academic_year = $${params.length}`;
    } else if (getStudentsDto.classId || getStudentsDto.sectionId) {
      query += ` AND e.is_current = true`;
    }

    if (getStudentsDto.classId) {
      params.push(getStudentsDto.classId);
      query += ` AND e.class_id = $${params.length}`;
    }

    if (getStudentsDto.sectionId) {
      params.push(getStudentsDto.sectionId);
      query += ` AND e.section_id = $${params.length}`;
    }

    const sortOrder = getStudentsDto.order === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY s.created_at ${sortOrder}`;

    const page = getStudentsDto.page || 1;
    const take = getStudentsDto.take || 10;
    const offset = (page - 1) * take;
    params.push(offset, take);
    query += ` OFFSET $${params.length - 1} LIMIT $${params.length}`;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      LEFT JOIN student_enrollments e ON s.student_id = e.student_id AND e.school_id = s.school_id
      WHERE s.school_id = $1 AND s.is_active = true
    `;
    const countParams: any[] = [schoolId];

    if (getStudentsDto.gender) {
      countParams.push(getStudentsDto.gender);
      countQuery += ` AND s.gender = $${countParams.length}`;
    }
    if (getStudentsDto.currentStatus) {
      countParams.push(getStudentsDto.currentStatus);
      countQuery += ` AND s.current_status = $${countParams.length}`;
    }
    if (getStudentsDto.academicYear) {
      countParams.push(getStudentsDto.academicYear);
      countQuery += ` AND e.academic_year = $${countParams.length}`;
    } else if (getStudentsDto.classId || getStudentsDto.sectionId) {
      countQuery += ` AND e.is_current = true`;
    }
    if (getStudentsDto.classId) {
      countParams.push(getStudentsDto.classId);
      countQuery += ` AND e.class_id = $${countParams.length}`;
    }
    if (getStudentsDto.sectionId) {
      countParams.push(getStudentsDto.sectionId);
      countQuery += ` AND e.section_id = $${countParams.length}`;
    }

    const [entities, countResult] = await Promise.all([
      this.db.query<Student>(query, params),
      this.db.query<{ total: string }>(countQuery, countParams),
    ]);

    const itemCount = parseInt(countResult[0]?.total || '0', 10);
    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: getStudentsDto,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.db.queryOne<Student>(
      `SELECT * FROM students WHERE student_id = $1 AND is_active = true`,
      [id],
    );

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByAdmissionNumber(
    admissionNumber: string,
    schoolId: number,
  ): Promise<Student> {
    const student = await this.db.queryOne<Student>(
      `SELECT * FROM students WHERE admission_number = $1 AND school_id = $2 AND is_active = true`,
      [admissionNumber, schoolId],
    );

    if (!student) {
      throw new NotFoundException(
        `Student with admission number ${admissionNumber} not found`,
      );
    }

    return student;
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    userId: number = 1,
  ): Promise<Student> {
    const student = await this.findOne(id);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      firstNameEn: 'first_name_en',
      middleNameEn: 'middle_name_en',
      lastNameEn: 'last_name_en',
      firstNameNp: 'first_name_np',
      middleNameNp: 'middle_name_np',
      lastNameNp: 'last_name_np',
      gender: 'gender',
      dateOfBirthAd: 'date_of_birth_ad',
      dateOfBirthBs: 'date_of_birth_bs',
      studentEmail: 'student_email',
      studentMobile: 'student_mobile',
      currentStatus: 'current_status',
      isGovtMandatedFreeSeat: 'is_govt_mandated_free_seat',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateStudentDto[key as keyof UpdateStudentDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateStudentDto[key as keyof UpdateStudentDto]);
      }
    }

    if (updates.length > 0) {
      updates.push(`updated_by = $${paramIndex++}`);
      params.push(userId);
      params.push(id);

      await this.db.query(
        `UPDATE students SET ${updates.join(', ')}, updated_at = NOW() WHERE student_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number, userId: number = 1): Promise<void> {
    await this.findOne(id);
    await this.db.query(
      `UPDATE students SET is_active = false, deleted_at = NOW(), updated_by = $2 WHERE student_id = $1`,
      [id, userId],
    );
  }

  async getStudentWithFullDetails(id: number): Promise<any> {
    const student = await this.findOne(id);
    return student;
  }

  async searchStudents(schoolId: number, query: string): Promise<Student[]> {
    const normalizedQuery = `%${query.toLowerCase()}%`;

    return this.db.query<Student>(
      `SELECT * FROM students WHERE school_id = $1 AND is_active = true 
       AND (LOWER(first_name_en) LIKE $2 OR LOWER(last_name_en) LIKE $2 
       OR LOWER(first_name_np) LIKE $2 OR LOWER(last_name_np) LIKE $2 
       OR admission_number LIKE $2)
       ORDER BY created_at DESC LIMIT 50`,
      [schoolId, normalizedQuery],
    );
  }
}
