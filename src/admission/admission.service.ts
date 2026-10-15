import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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

    const buildParams = (applicationNo: string) => [
      schoolId,
      applicationNo,
      dto.firstName,
      dto.middleName ?? null,
      dto.lastName,
      dto.firstNameNp,
      dto.middleNameNp ?? null,
      dto.lastNameNp,
      dto.gender,
      dto.dateOfBirth,
      dto.dateOfBirthBs,
      dto.birthPlace,
      dto.birthPlaceNp ?? null,
      dto.nationality,
      dto.nationalityNp ?? null,
      dto.religion ?? null,
      dto.religionNp ?? null,
      dto.caste ?? null,
      dto.casteNp ?? null,
      dto.gradeApplied ?? null,
      dto.gradeAppliedNp ?? null,
      dto.parentName ?? null,
      dto.parentNameNp ?? null,
      dto.email ?? null,
      dto.phone,
      dto.mobile,
      dto.fatherName,
      dto.fatherNameNp ?? null,
      dto.fatherPhone,
      dto.fatherOccupation ?? null,
      dto.fatherOccupationNp ?? null,
      dto.motherName,
      dto.motherNameNp ?? null,
      dto.motherPhone,
      dto.motherOccupation ?? null,
      dto.motherOccupationNp ?? null,
      dto.guardianName ?? null,
      dto.guardianNameNp ?? null,
      dto.guardianPhone ?? null,
      dto.guardianRelation ?? null,
      dto.guardianRelationNp ?? null,
      dto.provinceId ?? null,
      dto.districtId ?? null,
      dto.municipalityId ?? null,
      dto.wardNumber ?? null,
      dto.address,
      dto.previousSchool ?? null,
      dto.previousSchoolNp ?? null,
      dto.previousClass ?? null,
      dto.previousClassNp ?? null,
      dto.previousGrade ?? null,
      dto.previousGradeNp ?? null,
      dto.transferCertificate ?? null,
      dto.classId,
      dto.photoUrl ?? null,
    ];

    // application_no is COUNT(*)+1 based — retry on a concurrent collision
    // (unique violation) instead of surfacing a 500.
    for (let attempt = 0; attempt < 3; attempt++) {
      const applicationNo = await this.generateApplicationNo(schoolId);
      try {
        const result = await this.databaseService.query(
          query,
          buildParams(applicationNo),
        );
        return result[0];
      } catch (error: any) {
        if (error?.code === '23505' && attempt < 2) continue;
        throw error;
      }
    }
    throw new BadRequestException('Could not generate an application number');
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
    sectionId: number,
    enrolledBy?: number,
    admissionDateBs?: string,
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
      const hashedPassword = await this.hashPassword(tempPassword);
      const username = `student${Date.now()}${Math.floor(Math.random() * 10000)}`;

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
      const resolvedSectionId = sectionId;
      if (resolvedSectionId) {
        const owned = await client.query(
          `SELECT section_id FROM sections WHERE section_id = $1 AND class_id = $2 AND school_id = $3 AND is_active = true`,
          [resolvedSectionId, app.class_id, schoolId],
        );
        if (!owned.rows[0]) {
          throw new BadRequestException(
            'Section does not belong to this school/class',
          );
        }
      }
      // Section is required: admins pre-create classes/sections and the
      // frontend always sends both. The backend only validates ownership.
      if (!resolvedSectionId) {
        throw new BadRequestException(
          'sectionId is required — admins create sections before enrolling',
        );
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

      // Complete profiles are mandatory (students columns are NOT NULL):
      // reject incomplete applications instead of inventing data.
      const missingAddr = [
        'province_id',
        'district_id',
        'municipality_id',
        'ward_number',
      ].filter((k) => app[k] == null);
      if (missingAddr.length > 0) {
        throw new BadRequestException(
          `Application address incomplete (missing: ${missingAddr.join(', ')}). Update the application first.`,
        );
      }
      const missingProfile = [
        'first_name',
        'last_name',
        'gender',
        'date_of_birth',
        'nationality',
        'religion',
        'father_name',
        'mother_name',
        'class_id',
      ].filter((k) => app[k] == null || app[k] === '');
      if (missingProfile.length > 0) {
        throw new BadRequestException(
          `Application profile incomplete (missing: ${missingProfile.join(', ')}). Update the application first.`,
        );
      }
      if (!app.caste) {
        throw new BadRequestException(
          'Application caste/ethnicity is required for enrollment.',
        );
      }
      const casteHit = await client.query(
        `SELECT caste_code FROM caste_ethnicity_groups
          WHERE caste_code = $1 OR LOWER(name_en) = LOWER($1) OR LOWER(iemis_group) = LOWER($1)
          LIMIT 1`,
        [String(app.caste).trim()],
      );
      // Same 'Brahmin' → 01A leniency as student registration (master
      // stores 'Brahmin-Hill'; forms send 'Brahmin').
      const casteCode =
        casteHit.rows[0]?.caste_code ??
        (String(app.caste).trim().toLowerCase() === 'brahmin' ? '01A' : null);
      if (!casteCode) {
        throw new BadRequestException(
          `Unrecognized caste/ethnicity '${app.caste}'. Must match a CEHRD master code or name.`,
        );
      }
      const enrollDisplayName = app.first_name_np
        ? `${app.first_name_np} ${app.last_name_np || ''}`.trim()
        : `${app.first_name} ${app.last_name || ''}`.trim();

      const studentRows = await client.query(
        `INSERT INTO students (
           school_id, user_id, admission_number, student_code,
           first_name_en, middle_name_en, last_name_en,
           first_name_np, middle_name_np, last_name_np, display_name,
           gender, date_of_birth_ad, date_of_birth_bs, nationality, nationality_np,
           religion, religion_np, mother_tongue, mother_tongue_np,
           caste_ethnicity, caste_ethnicity_np, caste_code,
           birthplace, birthplace_np, blood_group,
           student_email, student_mobile,
           father_name, father_phone, father_name_np, mother_name, mother_phone, mother_name_np,
           permanent_province_id, permanent_district_id, permanent_municipality_id,
           permanent_ward_no, permanent_tole_en, permanent_tole_np,
           temporary_province_id, temporary_district_id, temporary_municipality_id,
           temporary_ward_no, temporary_tole_en, temporary_address_en, temporary_tole_np, temporary_address_np,
           created_by, updated_by,
           disability_type, disability_type_np,
           admission_date, admission_date_bs, admission_class_id, roll_number,
           profile_photo_url,
           current_status, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, CURRENT_DATE, $53, $54, 0, $55, 'ACTIVE', true)
         RETURNING student_id`,
        [
          schoolId,
          userRows.rows[0].user_id,
          studentCode,
          studentCode,
          app.first_name,
          app.middle_name || '',
          app.last_name,
          app.first_name_np,
          app.middle_name_np || '',
          app.last_name_np,
          enrollDisplayName,
          canonicalGender,
          app.date_of_birth,
          app.date_of_birth_bs,
          app.nationality || '',
          app.nationality_np || '',
          app.religion || '',
          app.religion_np || '',
          '',
          '',
          app.caste,
          app.caste_np || '',
          casteCode,
          app.birth_place || '',
          app.birth_place_np || '',
          '',
          app.email || '',
          app.mobile || app.phone || '',
          app.father_name,
          app.father_phone || '',
          app.father_name_np || '',
          app.mother_name,
          app.mother_phone || '',
          app.mother_name_np || '',
          app.province_id,
          app.district_id,
          app.municipality_id,
          app.ward_number,
          app.address || '',
          '',
          0,
          0,
          0,
          0,
          '',
          '',
          '',
          '',
          enrolledBy ?? null,
          enrolledBy ?? null,
          'NONE',
          'कुनै छैन',
          admissionDateBs || '',
          app.class_id,
          app.photo_url || '',
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
    // student_guardians.relationship_type is check-constrained — map any
    // free-form application value onto the allowed set.
    const rawRelation = String(
      app.guardian_relation || 'GUARDIAN',
    ).toUpperCase();
    const allowedRelations = [
      'FATHER',
      'MOTHER',
      'GRANDFATHER',
      'GRANDMOTHER',
      'UNCLE',
      'AUNT',
      'BROTHER',
      'SISTER',
      'GUARDIAN',
      'OTHER',
    ];
    const relation = allowedRelations.includes(rawRelation)
      ? rawRelation
      : 'GUARDIAN';
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
          relation,
          app.father_occupation || app.mother_occupation || null,
        ],
      );
      guardianId = created.guardian_id;
    }
    await this.databaseService.query(
      `INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_emergency_contact, is_fee_payer, is_active)
       VALUES ($1, $2, $3, true, true, true, true)
       ON CONFLICT (student_id, guardian_id) DO NOTHING`,
      [studentId, guardianId, relation],
    );
  }

  async deleteApplication(id: number, schoolId: number): Promise<void> {
    // DELETE without RETURNING yields zero rows — RETURNING is required to
    // distinguish "deleted" from "not found".
    const result = await this.databaseService.query<{ id: number }>(
      'DELETE FROM online_admissions WHERE id = $1 AND school_id = $2 RETURNING id',
      [id, schoolId],
    );

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

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
