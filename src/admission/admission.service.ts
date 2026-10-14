import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface OnlineAdmission {
  id?: number;
  schoolId: number;
  applicationNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  firstNameNp: string;
  middleNameNp?: string;
  lastNameNp: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  dateOfBirthBs: string;
  birthPlace: string;
  nationality: string;
  religion?: string;
  caste?: string;

  email?: string;
  phone: string;
  mobile: string;

  fatherName: string;
  fatherPhone: string;
  fatherOccupation?: string;
  motherName: string;
  motherPhone: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;

  provinceId?: number;
  districtId?: number;
  municipalityId?: number;
  wardNumber?: number;
  address: string;

  previousSchool?: string;
  previousClass?: string;
  previousGrade?: string;
  transferCertificate?: boolean;

  classId: number;
  sectionId?: number;

  photoUrl?: string;
  documents: any[];

  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'enrolled';
  remarks?: string;
  appliedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: number;
}

export interface CreateAdmissionDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  firstNameNp: string;
  middleNameNp?: string;
  lastNameNp: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  dateOfBirthBs: string;
  birthPlace: string;
  birthPlaceNp?: string;
  nationality: string;
  nationalityNp?: string;
  religion?: string;
  religionNp?: string;
  caste?: string;
  casteNp?: string;
  gradeApplied?: string;
  gradeAppliedNp?: string;
  parentName?: string;
  parentNameNp?: string;
  email?: string;
  phone: string;
  mobile: string;
  fatherName: string;
  fatherNameNp?: string;
  fatherPhone: string;
  fatherOccupation?: string;
  fatherOccupationNp?: string;
  motherName: string;
  motherNameNp?: string;
  motherPhone: string;
  motherOccupation?: string;
  motherOccupationNp?: string;
  guardianName?: string;
  guardianNameNp?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  guardianRelationNp?: string;
  provinceId?: number;
  districtId?: number;
  municipalityId?: number;
  wardNumber?: number;
  address: string;
  previousSchool?: string;
  previousSchoolNp?: string;
  previousClass?: string;
  previousClassNp?: string;
  previousGrade?: string;
  previousGradeNp?: string;
  transferCertificate?: boolean;
  classId: number;
  photoUrl?: string;
}

@Injectable()
export class AdmissionService {
  private readonly logger = new Logger(AdmissionService.name);
  constructor(private databaseService: DatabaseService) {}

  async createApplication(
    schoolId: number,
    dto: CreateAdmissionDto,
  ): Promise<OnlineAdmission> {
    const applicationNo = await this.generateApplicationNo(schoolId);

    const query = `
      INSERT INTO online_admissions (
        school_id, application_no, first_name, middle_name, last_name,
        first_name_np, middle_name_np, last_name_np,
        gender, date_of_birth, date_of_birth_bs, birth_place, birth_place_np,
        nationality, nationality_np, religion, religion_np, caste, caste_np,
        grade_applied, grade_applied_np, parent_name, parent_name_np,
        email, phone, mobile,
        father_name, father_name_np, father_phone, father_occupation, father_occupation_np,
        mother_name, mother_name_np, mother_phone, mother_occupation, mother_occupation_np,
        guardian_name, guardian_name_np, guardian_phone, guardian_relation, guardian_relation_np,
        province_id, district_id, municipality_id, ward_number, address,
        previous_school, previous_school_np, previous_class, previous_class_np, previous_grade, previous_grade_np, transfer_certificate,
        class_id, photo_url, status, documents, applied_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, 'pending', '[]', NOW())
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      applicationNo,
      dto.firstName,
      dto.middleName,
      dto.lastName,
      dto.firstNameNp,
      dto.middleNameNp,
      dto.lastNameNp,
      dto.gender,
      dto.dateOfBirth,
      dto.dateOfBirthBs,
      dto.birthPlace,
      dto.birthPlaceNp ?? null,
      dto.nationality,
      dto.nationalityNp ?? null,
      dto.religion,
      dto.religionNp ?? null,
      dto.caste,
      dto.casteNp ?? null,
      dto.gradeApplied ?? null,
      dto.gradeAppliedNp ?? null,
      dto.parentName ?? null,
      dto.parentNameNp ?? null,
      dto.email,
      dto.phone,
      dto.mobile,
      dto.fatherName,
      dto.fatherNameNp ?? null,
      dto.fatherPhone,
      dto.fatherOccupation,
      dto.fatherOccupationNp ?? null,
      dto.motherName,
      dto.motherNameNp ?? null,
      dto.motherPhone,
      dto.motherOccupation,
      dto.motherOccupationNp ?? null,
      dto.guardianName,
      dto.guardianNameNp ?? null,
      dto.guardianPhone,
      dto.guardianRelation,
      dto.guardianRelationNp ?? null,
      dto.provinceId,
      dto.districtId,
      dto.municipalityId,
      dto.wardNumber,
      dto.address,
      dto.previousSchool,
      dto.previousSchoolNp ?? null,
      dto.previousClass,
      dto.previousClassNp ?? null,
      dto.previousGrade,
      dto.previousGradeNp ?? null,
      dto.transferCertificate,
      dto.classId,
      dto.photoUrl,
    ]);

    return result[0];
  }

  async getApplications(
    schoolId: number,
    status?: string,
  ): Promise<OnlineAdmission[]> {
    let query = 'SELECT * FROM online_admissions WHERE school_id = $1';
    const params: any[] = [schoolId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY applied_at DESC';

    return this.databaseService.query(query, params);
  }

  async getApplicationById(
    id: number,
    schoolId: number,
  ): Promise<OnlineAdmission> {
    const query =
      'SELECT * FROM online_admissions WHERE id = $1 AND school_id = $2';
    const result = await this.databaseService.query(query, [id, schoolId]);

    if (!result[0]) {
      throw new NotFoundException('Application not found');
    }

    return result[0];
  }

  async getApplicationByNo(
    applicationNo: string,
    schoolId: number,
  ): Promise<OnlineAdmission> {
    const query =
      'SELECT * FROM online_admissions WHERE application_no = $1 AND school_id = $2';
    const result = await this.databaseService.query(query, [
      applicationNo,
      schoolId,
    ]);

    if (!result[0]) {
      throw new NotFoundException('Application not found');
    }

    return result[0];
  }

  async reviewApplication(
    id: number,
    schoolId: number,
    status: 'reviewed' | 'approved' | 'rejected',
    remarks: string,
    reviewedBy: number,
  ): Promise<OnlineAdmission> {
    const query = `
      UPDATE online_admissions 
      SET status = $3, remarks = $4, reviewed_at = NOW(), reviewed_by = $5
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      id,
      schoolId,
      status,
      remarks,
      reviewedBy,
    ]);

    if (!result[0]) {
      throw new NotFoundException('Application not found');
    }

    return result[0];
  }

  async enrollStudent(
    id: number,
    schoolId: number,
    sectionId?: number,
  ): Promise<{ studentId: number; userId: number }> {
    const application = await this.getApplicationById(id, schoolId);

    if (application.status !== 'approved') {
      throw new BadRequestException(
        'Application must be approved before enrollment',
      );
    }

    // One real transaction (pool.query('BEGIN') would pin the BEGIN to a
    // random pooled connection and commit nothing — this uses a client).
    // NOTE: application rows are snake_case (raw DB); app alias below.
    const app = application as any;
    const enrolled = await this.databaseService.transaction(async (client) => {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = this.hashPassword(tempPassword);
      const username = `student${Date.now()}`;

      const userRows = await client.query(
        `INSERT INTO users (school_id, username, email, password, user_type, is_active, must_change_password, is_verified, created_at)
         VALUES ($1, $2, $3, $4, 'STUDENT', true, true, true, NOW())
         RETURNING user_id`,
        [
          schoolId,
          username,
          application.email || `${username}@sms.local`,
          hashedPassword,
        ],
      );

      // Placement needs an active session and a section: honest errors beat
      // invented placements.
      const session = await client.query(
        `SELECT academic_year_id FROM academic_years
          WHERE school_id = $1 AND is_current = true LIMIT 1`,
        [schoolId],
      );
      if (!session.rows[0]) {
        throw new BadRequestException(
          'No active academic session — create one before enrolling',
        );
      }
      let resolvedSectionId = sectionId;
      if (!resolvedSectionId) {
        const firstSection = await client.query(
          `SELECT section_id FROM sections WHERE class_id = $1 ORDER BY section_id LIMIT 1`,
          [app.class_id],
        );
        if (!firstSection.rows[0]) {
          throw new BadRequestException(
            'Class has no sections — create one before enrolling',
          );
        }
        resolvedSectionId = firstSection.rows[0].section_id;
      }
      const rollRow = await client.query(
        `SELECT COALESCE(MAX(roll_no), 0) as max_roll FROM enrollments
          WHERE academic_year_id = $1 AND class_id = $2 AND section_id = $3`,
        [session.rows[0].academic_year_id, app.class_id, resolvedSectionId],
      );
      const rollNo = parseInt(rollRow.rows[0]?.max_roll || '0', 10) + 1;

      const studentCode = await this.generateStudentCode(schoolId);
      const canonicalGender =
        (
          { male: 'MALE', female: 'FEMALE', other: 'OTHER' } as Record<
            string,
            string
          >
        )[String(app.gender).toLowerCase()] || 'OTHER';

      const studentRows = await client.query(
        `INSERT INTO students (
           school_id, user_id, admission_number, student_code,
           first_name_en, middle_name_en, last_name_en,
           first_name_np, middle_name_np, last_name_np,
           gender, date_of_birth_ad, date_of_birth_bs, nationality,
           caste_ethnicity, student_email, student_mobile,
           father_name, father_phone, mother_name, mother_phone,
           permanent_province_id, permanent_district_id, permanent_municipality_id,
           permanent_ward_no, permanent_tole_en, profile_photo_url,
           current_status, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'ACTIVE', true)
         RETURNING student_id`,
        [
          schoolId,
          userRows.rows[0].user_id,
          studentCode,
          studentCode,
          app.first_name,
          app.middle_name,
          app.last_name,
          app.first_name_np,
          app.middle_name_np,
          app.last_name_np,
          canonicalGender,
          app.date_of_birth,
          app.date_of_birth_bs,
          app.nationality,
          app.caste,
          app.email,
          app.mobile || app.phone,
          app.father_name,
          app.father_phone,
          app.mother_name,
          app.mother_phone,
          app.province_id,
          app.district_id,
          app.municipality_id,
          app.ward_number,
          app.address,
          app.photo_url,
        ],
      );

      await client.query(
        `INSERT INTO enrollments (school_id, student_id, academic_year_id, class_id, section_id, roll_no, status, enrolled_on_ad)
         VALUES ($1, $2, $3, $4, $5, $6, 'ENROLLED', CURRENT_DATE)`,
        [
          schoolId,
          studentRows.rows[0].student_id,
          session.rows[0].academic_year_id,
          app.class_id,
          resolvedSectionId,
          rollNo,
        ],
      );

      await client.query(
        'UPDATE online_admissions SET status = $1 WHERE id = $2 AND school_id = $3',
        ['enrolled', id, schoolId],
      );

      return {
        studentId: studentRows.rows[0].student_id,
        userId: userRows.rows[0].user_id,
      };
    });

    // Best-effort guardian linkage AFTER commit: auxiliary records must never
    // roll back an enrollment (nested failure would abort the txn otherwise).
    try {
      await this.linkApplicationGuardian(
        schoolId,
        enrolled.studentId,
        application as any,
      );
    } catch (error: any) {
      this.logger.warn(`Guardian linkage skipped: ${error.message}`);
    }

    return enrolled;
  }

  /**
   * Creates one guardian from the application (explicit guardian first,
   * then father, then mother) and links it as primary fee-payer. Requires a
   * valid Nepali mobile; otherwise skips loudly via the caller's warning.
   */
  private async linkApplicationGuardian(
    schoolId: number,
    studentId: number,
    app: any,
  ): Promise<void> {
    const name =
      app.guardian_name || app.father_name || app.mother_name || null;
    const phone =
      app.guardian_phone || app.father_phone || app.mother_phone || null;
    if (!name || !phone || !/^(98|97|96)[0-9]{8}$/.test(phone)) {
      throw new Error('no mappable guardian contact on application');
    }
    const parts = String(name).trim().split(/\s+/);
    const guardianCode = `GRD-ADM-${app.application_no || Date.now()}`;
    const existing = await this.databaseService.queryOne<{
      guardian_id: number;
    }>(
      `SELECT guardian_id FROM guardians WHERE mobile = $1 AND school_id = $2 AND is_active = true`,
      [phone, schoolId],
    );
    let guardianId = existing?.guardian_id;
    if (!guardianId) {
      const created = await this.databaseService.insert<{
        guardian_id: number;
      }>(
        `INSERT INTO guardians (school_id, guardian_code, first_name_en, last_name_en, mobile, relation_to_student, occupation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING guardian_id`,
        [
          schoolId,
          guardianCode,
          parts[0],
          parts.slice(1).join(' ') || parts[0],
          phone,
          (app.guardian_relation || 'GUARDIAN').toUpperCase(),
          app.father_occupation || app.mother_occupation || null,
        ],
      );
      guardianId = created.guardian_id;
    }
    await this.databaseService.query(
      `INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_emergency_contact, is_fee_payer, is_active)
       VALUES ($1, $2, $3, true, true, true, true)
       ON CONFLICT (student_id, guardian_id) DO NOTHING`,
      [
        studentId,
        guardianId,
        (app.guardian_relation || 'GUARDIAN').toUpperCase(),
      ],
    );
  }

  async deleteApplication(id: number, schoolId: number): Promise<void> {
    const query =
      'DELETE FROM online_admissions WHERE id = $1 AND school_id = $2';
    const result = await this.databaseService.query(query, [id, schoolId]);

    if (result.length === 0) {
      throw new NotFoundException('Application not found');
    }
  }

  async getAdmissionStatistics(schoolId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'enrolled') as enrolled,
        COUNT(*) as total
      FROM online_admissions
      WHERE school_id = $1
    `;

    const result = await this.databaseService.query(query, [schoolId]);
    return result[0];
  }

  private async generateApplicationNo(schoolId: number): Promise<string> {
    const year = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) + 1 as count 
      FROM online_admissions 
      WHERE school_id = $1 AND EXTRACT(YEAR FROM applied_at) = $2
    `;
    const result = await this.databaseService.query(query, [schoolId, year]);
    const count = result[0].count.toString().padStart(4, '0');
    return `ADM${year}${count}`;
  }

  private async generateStudentCode(schoolId: number): Promise<string> {
    const query = `
      SELECT student_code 
      FROM students 
      WHERE school_id = $1 
      ORDER BY student_id DESC 
      LIMIT 1
    `;
    const result = await this.databaseService.query(query, [schoolId]);

    if (result[0]) {
      const lastCode = result[0].student_code;
      const lastNum = parseInt(lastCode.replace(/\D/g, ''));
      return `STU${(lastNum + 1).toString().padStart(6, '0')}`;
    }

    return `STU${new Date().getFullYear()}000001`;
  }

  private hashPassword(password: string): string {
    return password;
  }
}
