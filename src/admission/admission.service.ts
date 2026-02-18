import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
  photoUrl?: string;
}

@Injectable()
export class AdmissionService {
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
        gender, date_of_birth, date_of_birth_bs, birth_place,
        nationality, religion, caste, email, phone, mobile,
        father_name, father_phone, father_occupation,
        mother_name, mother_phone, mother_occupation,
        guardian_name, guardian_phone, guardian_relation,
        province_id, district_id, municipality_id, ward_number, address,
        previous_school, previous_class, previous_grade, transfer_certificate,
        class_id, photo_url, status, documents, applied_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, 'pending', '[]', NOW())
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
      dto.nationality,
      dto.religion,
      dto.caste,
      dto.email,
      dto.phone,
      dto.mobile,
      dto.fatherName,
      dto.fatherPhone,
      dto.fatherOccupation,
      dto.motherName,
      dto.motherPhone,
      dto.motherOccupation,
      dto.guardianName,
      dto.guardianPhone,
      dto.guardianRelation,
      dto.provinceId,
      dto.districtId,
      dto.municipalityId,
      dto.wardNumber,
      dto.address,
      dto.previousSchool,
      dto.previousClass,
      dto.previousGrade,
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

    await this.databaseService.query('BEGIN');

    const userQuery = `
      INSERT INTO users (school_id, email, password, role, is_active, must_change_password, created_at)
      VALUES ($1, $2, $3, 'student', true, true, NOW())
      RETURNING user_id
    `;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await this.hashPassword(tempPassword);

    const userResult = await this.databaseService.query(userQuery, [
      schoolId,
      application.email || `student${Date.now()}@sms.local`,
      hashedPassword,
    ]);

    const studentQuery = `
      INSERT INTO students (
        school_id, user_id, student_code, first_name_en, middle_name_en, last_name_en,
        first_name_np, middle_name_np, last_name_np,
        gender, date_of_birth, nationality, phone, mobile, email,
        father_name, father_phone, mother_name, mother_phone,
        province_id, district_id, municipality_id, ward_number, address,
        profile_image, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, true, NOW())
      RETURNING student_id
    `;

    const studentCode = await this.generateStudentCode(schoolId);

    const studentResult = await this.databaseService.query(studentQuery, [
      schoolId,
      userResult[0].user_id,
      studentCode,
      application.firstName,
      application.middleName,
      application.lastName,
      application.firstNameNp,
      application.middleNameNp,
      application.lastNameNp,
      application.gender,
      application.dateOfBirth,
      application.nationality,
      application.phone,
      application.mobile,
      application.email,
      application.fatherName,
      application.fatherPhone,
      application.motherName,
      application.motherPhone,
      application.provinceId,
      application.districtId,
      application.municipalityId,
      application.wardNumber,
      application.address,
      application.photoUrl,
    ]);

    const enrollmentQuery = `
      INSERT INTO student_enrollments (student_id, school_id, class_id, section_id, academic_year, is_active, enrolled_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
    `;

    const academicYear = new Date().getFullYear();
    await this.databaseService.query(enrollmentQuery, [
      studentResult[0].student_id,
      schoolId,
      application.classId,
      sectionId,
      academicYear,
    ]);

    await this.databaseService.query('COMMIT');

    await this.databaseService.query(
      'UPDATE online_admissions SET status = $1 WHERE id = $2',
      ['enrolled', id],
    );

    return {
      studentId: studentResult[0].student_id,
      userId: userResult[0].user_id,
    };
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

  private async hashPassword(password: string): Promise<string> {
    return password;
  }
}
