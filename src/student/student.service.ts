import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { EncryptionUtil } from '../utils/encryption.util';

/** PII at rest: identity/financial fields are AES-encrypted (see 014). */
const enc = (v: string | null | undefined): string | null =>
  v ? EncryptionUtil.encrypt(v) : null;
const dec = (v: string | null): string | null =>
  v ? EncryptionUtil.decrypt(v) : v;

/** Decrypt identity fields on rows leaving the service (tolerates partial selects). */
function decStudent<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  for (const k of [
    'citizenship_number',
    'birth_certificate_number',
    'nin',
  ] as const) {
    if (k in row) (row as any)[k] = dec(row[k] ?? null);
  }
  return row;
}
import { GOVT_FREE_SEAT_QUOTA_PERCENT } from '../common/constants/nepal.constants';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { Order } from '../common/dto/page-options.dto';
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
  // Canonical registry additions (005). dob_bs_snapshot kept as a phantom:
  // column dropped, interface stays a superset so existing consumers compile.
  iemis_student_id?: string | null;
  nin?: string | null;
  citizenship_issue_district?: string | null;
  citizenship_issue_date?: Date | null;
  citizenship_issue_date_bs?: string | null;
  caste_code?: string | null;
  has_disability?: boolean | null;
  disability_type?: string | null;
  admission_date_bs?: string | null;
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

      // BS date comes from the frontend — the backend stores it as given.
      const dateOfBirthBs = createStudentDto.dateOfBirthBs || null;

      const displayName = createStudentDto.firstNameNp
        ? `${createStudentDto.firstNameNp} ${createStudentDto.lastNameNp || ''}`.trim()
        : `${createStudentDto.firstNameEn} ${createStudentDto.lastNameEn || ''}`.trim();

      // Canonical caste: validated FK when the raw value maps to the CEHRD
      // master (code or English name); raw text always kept for display.
      const casteCode = await this.resolveCasteCode(
        createStudentDto.casteEthnicity,
      );

      const student = await this.db.insert<Student>(
        `INSERT INTO students (
        school_id, student_code, admission_number,
        admission_date, admission_date_bs, admission_class_id,
        first_name_en, middle_name_en, last_name_en,
        first_name_np, middle_name_np, last_name_np, display_name,
        gender, date_of_birth_ad, date_of_birth_bs,
        student_email, student_mobile,
        current_status, is_active, is_govt_mandated_free_seat, is_economically_disadvantaged,
        caste_code, caste_ethnicity, citizenship_number, citizenship_issue_district, citizenship_issue_date, citizenship_issue_date_bs, birth_certificate_number, nin,
        iemis_student_id, has_disability, disability_type,
        blood_group, religion, mother_tongue,
        permanent_province_id, permanent_district_id, permanent_municipality_id, permanent_ward_no,
        permanent_tole_en, permanent_tole_np,
        temporary_province_id, temporary_district_id, temporary_municipality_id, temporary_ward_no,
        temporary_tole_en, temporary_address_en, temporary_tole_np, temporary_address_np,
        created_by, updated_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52)
       RETURNING *`,
        [
          createStudentDto.schoolId,
          studentCode,
          createStudentDto.admissionNumber,
          createStudentDto.admissionDate || new Date(),
          createStudentDto.admissionDateBs || null,
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
          createStudentDto.studentEmail || null,
          createStudentDto.studentMobile || null,
          createStudentDto.currentStatus || 'ACTIVE',
          true,
          createStudentDto.isGovtMandatedFreeSeat || false,
          false,
          casteCode,
          createStudentDto.casteEthnicity || null,
          enc(createStudentDto.citizenshipNumber),
          createStudentDto.citizenshipIssueDistrict || null,
          createStudentDto.citizenshipIssueDate || null,
          createStudentDto.citizenshipIssueDateBs || null,
          enc(createStudentDto.birthCertificateNumber),
          enc(createStudentDto.nin),
          createStudentDto.iemisStudentId || null,
          createStudentDto.hasDisability || false,
          createStudentDto.disabilityType || null,

          createStudentDto.bloodGroup || null,
          createStudentDto.religion || null,
          createStudentDto.motherTongue || null,
          createStudentDto.permanentProvinceId || null,
          createStudentDto.permanentDistrictId || null,
          createStudentDto.permanentMunicipalityId || null,
          createStudentDto.permanentWardNo || null,
          createStudentDto.permanentToleEn || null,
          createStudentDto.permanentToleNp || null,
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

      return decStudent(student);
    } catch (error) {
      console.error('Student creation error:', error);
      throw error;
    }
  }

  /**
   * Maps raw caste input (CEHRD code like '01A' or English name like
   * 'Chhetri') to a validated caste_code FK. NULL when unmappable — the raw
   * text is always kept in caste_ethnicity for display/stewardship.
   */
  private async resolveCasteCode(
    raw: string | null | undefined,
  ): Promise<string | null> {
    if (!raw || !raw.trim()) return null;
    const hit = await this.db.queryOne<{ caste_code: string }>(
      `SELECT caste_code FROM caste_ethnicity_groups
        WHERE caste_code = $1 OR LOWER(name_en) = LOWER($1) OR LOWER(iemis_group) = LOWER($1)
        LIMIT 1`,
      [raw.trim()],
    );
    if (hit) return hit.caste_code;
    if (raw.trim().toLowerCase() === 'brahmin') return '01A';
    return null;
  }

  async findAll(
    schoolId: number,
    getStudentsDto: GetStudentsDto,
  ): Promise<PageDto<Student>> {
    const params: any[] = [schoolId];
    let sessionCond = `AND ay.is_current = true`;
    if (getStudentsDto.academicYear) {
      params.push(getStudentsDto.academicYear);
      sessionCond = `AND ay.session_name = $${params.length}`;
    }
    let query = `
      SELECT s.*, 
             en.roll_no AS roll_number, ay.session_name AS academic_year, en.class_id, en.section_id
      FROM students s
      LEFT JOIN academic_years ay ON ay.school_id = s.school_id ${sessionCond}
      LEFT JOIN enrollments en ON en.student_id = s.student_id
        AND en.academic_year_id = ay.academic_year_id
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

    if (getStudentsDto.classId) {
      params.push(getStudentsDto.classId);
      query += ` AND en.class_id = $${params.length}`;
    }

    if (getStudentsDto.sectionId) {
      params.push(getStudentsDto.sectionId);
      query += ` AND en.section_id = $${params.length}`;
    }

    const isAscending = getStudentsDto.order === Order.ASC;
    const sortOrder = isAscending ? 'ASC' : 'DESC';
    query += ` ORDER BY s.created_at ${sortOrder}`;

    const page = getStudentsDto.page || 1;
    const take = getStudentsDto.take || 10;
    const offset = (page - 1) * take;
    params.push(offset, take);
    query += ` OFFSET $${params.length - 1} LIMIT $${params.length}`;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      LEFT JOIN academic_years ay ON ay.school_id = s.school_id ${sessionCond}
      LEFT JOIN enrollments en ON en.student_id = s.student_id
        AND en.academic_year_id = ay.academic_year_id
      WHERE s.school_id = $1 AND s.is_active = true
    `;
    const countParams: any[] = [schoolId];
    // Mirror the academicYear push so $ positions match the main query.
    if (getStudentsDto.academicYear) {
      countParams.push(getStudentsDto.academicYear);
    }

    if (getStudentsDto.gender) {
      countParams.push(getStudentsDto.gender);
      countQuery += ` AND s.gender = $${countParams.length}`;
    }
    if (getStudentsDto.currentStatus) {
      countParams.push(getStudentsDto.currentStatus);
      countQuery += ` AND s.current_status = $${countParams.length}`;
    }
    if (getStudentsDto.classId) {
      countParams.push(getStudentsDto.classId);
      countQuery += ` AND en.class_id = $${countParams.length}`;
    }
    if (getStudentsDto.sectionId) {
      countParams.push(getStudentsDto.sectionId);
      countQuery += ` AND en.section_id = $${countParams.length}`;
    }

    const [entities, countResult] = await Promise.all([
      this.db.query<Student>(query, params),
      this.db.query<{ total: string }>(countQuery, countParams),
    ]);
    entities.forEach(decStudent);

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

    return decStudent(student);
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

    return decStudent(student);
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    userId: number = 1,
  ): Promise<Student> {
    await this.findOne(id);

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
      hasDisability: 'has_disability',
      disabilityType: 'disability_type',
      citizenshipNumber: 'citizenship_number',
      citizenshipIssueDistrict: 'citizenship_issue_district',
      citizenshipIssueDate: 'citizenship_issue_date',
      citizenshipIssueDateBs: 'citizenship_issue_date_bs',
      birthCertificateNumber: 'birth_certificate_number',
      nin: 'nin',
      iemisStudentId: 'iemis_student_id',
      admissionDateBs: 'admission_date_bs',
    };

    // PII at rest: encrypt identity/financial fields on the way in.
    const piiKeys = new Set([
      'citizenshipNumber',
      'nin',
      'birthCertificateNumber',
    ]);
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateStudentDto[key as keyof UpdateStudentDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        const value = updateStudentDto[key as keyof UpdateStudentDto];
        params.push(piiKeys.has(key) ? enc(value as string) : value);
      }
    }

    // Caste needs FK resolution; raw text is always kept alongside.
    if (updateStudentDto.casteEthnicity !== undefined) {
      updates.push(`caste_code = $${paramIndex++}`);
      params.push(await this.resolveCasteCode(updateStudentDto.casteEthnicity));
      updates.push(`caste_ethnicity = $${paramIndex++}`);
      params.push(updateStudentDto.casteEthnicity);
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

    const rows = await this.db.query<Student>(
      `SELECT * FROM students WHERE school_id = $1 AND is_active = true
       AND (LOWER(first_name_en) LIKE $2 OR LOWER(last_name_en) LIKE $2
       OR LOWER(first_name_np) LIKE $2 OR LOWER(last_name_np) LIKE $2
       OR admission_number LIKE $2)
       ORDER BY created_at DESC LIMIT 50`,
      [schoolId, normalizedQuery],
    );
    return rows.map(decStudent);
  }
}
