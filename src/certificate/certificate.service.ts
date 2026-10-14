import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Certificate {
  certificate_id: number;
  school_id: number;
  certificate_type: string;
  student_id: number;
  certificate_number: string | null;
  issued_date: Date;
  issued_date_bs: string | null;
  issued_by: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransferCertificate {
  tc_id: number;
  certificate_id: number;
  school_id: number;
  student_id: number;
  leaving_date: Date;
  leaving_date_bs: string | null;
  reason_for_leaving: string | null;
  character_grade: string | null;
  attendance_percentage: number | null;
  last_class_id: number | null;
  last_section_id: number | null;
  last_academic_year: string | null;
  is_conduct_certificate: boolean;
  tc_number: string | null;
  issued_to: string;
  signature_principal: boolean;
  signature_teacher: boolean;
  remarks: string | null;
  created_at: Date;
}

export interface BonafideCertificate {
  bonafide_id: number;
  certificate_id: number;
  school_id: number;
  student_id: number;
  purpose: string | null;
  is_verified: boolean;
  verified_by: number | null;
  verified_at: Date | null;
  created_at: Date;
}

export interface CharacterCertificate {
  character_id: number;
  certificate_id: number;
  school_id: number;
  student_id: number;
  character_grade: string | null;
  conduct_description: string | null;
  is_verified: boolean;
  verified_by: number | null;
  verified_at: Date | null;
  created_at: Date;
}

export interface CreateTCDto {
  schoolId: number;
  studentId: number;
  leavingDate: string;
  leavingDateBs?: string;
  reasonForLeaving?: string;
  reasonForLeavingNp?: string;
  characterGrade?: string;
  attendancePercentage?: number;
  lastClassId?: number;
  lastClassNp?: string;
  lastSectionId?: number;
  lastAcademicYear?: string;
  isConductCertificate?: boolean;
  issuedTo?: string;
  issuedToNp?: string;
  remarks?: string;
  remarksNp?: string;
  certificateTypeNp?: string;
  issuedBy: number;
}

export interface CreateBonafideDto {
  schoolId: number;
  studentId: number;
  purpose?: string;
  purposeNp?: string;
  certificateTypeNp?: string;
  issuedBy: number;
}

export interface CreateCharacterDto {
  schoolId: number;
  studentId: number;
  characterGrade?: string;
  characterRemarksNp?: string;
  conductDescription?: string;
  conductDescriptionNp?: string;
  certificateTypeNp?: string;
  issuedBy: number;
}

@Injectable()
export class CertificateService {
  constructor(private db: DatabaseService) {}

  async generateCertificateNumber(
    schoolId: number,
    type: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === 'TC' ? 'TC' : type === 'BONAFIDE' ? 'BC' : 'CC';
    const result = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM certificates WHERE school_id = $1 AND certificate_type = $2 AND EXTRACT(YEAR FROM created_at) = $3`,
      [schoolId, type, year],
    );
    const count = parseInt(result?.count || '0', 10) + 1;
    return `${prefix}-${year}-${count.toString().padStart(5, '0')}`;
  }

  async createTC(dto: CreateTCDto): Promise<TransferCertificate> {
    const student = await this.db.queryOne<{ student_id: number }>(
      `SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2`,
      [dto.studentId, dto.schoolId],
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const certificateNumber = await this.generateCertificateNumber(
      dto.schoolId,
      'TC',
    );

    const certificate = await this.db.insert<Certificate>(
      `INSERT INTO certificates (school_id, certificate_type, certificate_type_np, student_id, certificate_number, issued_date, issued_date_bs, issued_by, is_active)
       VALUES ($1, 'TC', $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        dto.schoolId,
        dto.certificateTypeNp || null,
        dto.studentId,
        certificateNumber,
        dto.leavingDate,
        dto.leavingDateBs || null,
        dto.issuedBy,
      ],
    );

    const tc = await this.db.insert<TransferCertificate>(
      `INSERT INTO transfer_certificates (certificate_id, school_id, student_id, leaving_date, leaving_date_bs, reason_for_leaving, reason_for_leaving_np, character_grade, attendance_percentage, last_class_id, last_class_np, last_section_id, last_academic_year, is_conduct_certificate, tc_number, issued_to, issued_to_np, signature_principal, signature_teacher, remarks, remarks_np)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        certificate.certificate_id,
        dto.schoolId,
        dto.studentId,
        dto.leavingDate,
        dto.leavingDateBs || null,
        dto.reasonForLeaving || null,
        dto.reasonForLeavingNp || null,
        dto.characterGrade || null,
        dto.attendancePercentage || null,
        dto.lastClassId || null,
        dto.lastClassNp || null,
        dto.lastSectionId || null,
        dto.lastAcademicYear || null,
        dto.isConductCertificate ?? true,
        certificateNumber,
        dto.issuedTo || 'PARENT',
        dto.issuedToNp || null,
        dto.remarks ? false : true,
        dto.remarks ? false : true,
        dto.remarks || null,
        dto.remarksNp || null,
      ],
    );

    return tc;
  }

  async createBonafide(dto: CreateBonafideDto): Promise<BonafideCertificate> {
    const student = await this.db.queryOne<{ student_id: number }>(
      `SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2`,
      [dto.studentId, dto.schoolId],
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const certificateNumber = await this.generateCertificateNumber(
      dto.schoolId,
      'BONAFIDE',
    );

    const certificate = await this.db.insert<Certificate>(
      `INSERT INTO certificates (school_id, certificate_type, certificate_type_np, student_id, certificate_number, issued_date, issued_by, is_active)
       VALUES ($1, 'BONAFIDE', $2, $3, $4, CURRENT_DATE, $5, true)
       RETURNING *`,
      [
        dto.schoolId,
        dto.certificateTypeNp || null,
        dto.studentId,
        certificateNumber,
        dto.issuedBy,
      ],
    );

    const bonafide = await this.db.insert<BonafideCertificate>(
      `INSERT INTO bonafide_certificates (certificate_id, school_id, student_id, purpose, purpose_np, is_verified, verified_by, verified_at)
       VALUES ($1, $2, $3, $4, $5, false, $6, NULL)
       RETURNING *`,
      [
        certificate.certificate_id,
        dto.schoolId,
        dto.studentId,
        dto.purpose || null,
        dto.purposeNp || null,
        dto.issuedBy,
      ],
    );

    return bonafide;
  }

  async createCharacter(
    dto: CreateCharacterDto,
  ): Promise<CharacterCertificate> {
    const student = await this.db.queryOne<{ student_id: number }>(
      `SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2`,
      [dto.studentId, dto.schoolId],
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const certificateNumber = await this.generateCertificateNumber(
      dto.schoolId,
      'CHARACTER',
    );

    const certificate = await this.db.insert<Certificate>(
      `INSERT INTO certificates (school_id, certificate_type, certificate_type_np, student_id, certificate_number, issued_date, issued_by, is_active)
       VALUES ($1, 'CHARACTER', $2, $3, $4, CURRENT_DATE, $5, true)
       RETURNING *`,
      [
        dto.schoolId,
        dto.certificateTypeNp || null,
        dto.studentId,
        certificateNumber,
        dto.issuedBy,
      ],
    );

    const character = await this.db.insert<CharacterCertificate>(
      `INSERT INTO character_certificates (certificate_id, school_id, student_id, character_grade, character_remarks_np, conduct_description, conduct_description_np, is_verified, verified_by, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, NULL)
       RETURNING *`,
      [
        certificate.certificate_id,
        dto.schoolId,
        dto.studentId,
        dto.characterGrade || null,
        dto.characterRemarksNp || null,
        dto.conductDescription || null,
        dto.conductDescriptionNp || null,
        dto.issuedBy,
      ],
    );

    return character;
  }

  async getStudentCertificates(
    studentId: number,
    schoolId: number,
  ): Promise<Certificate[]> {
    return this.db.query<Certificate>(
      `SELECT c.*, s.first_name_en, s.last_name_en, s.admission_number
       FROM certificates c
       LEFT JOIN students s ON c.student_id = s.student_id
       WHERE c.student_id = $1 AND c.school_id = $2 AND c.is_active = true
       ORDER BY c.created_at DESC`,
      [studentId, schoolId],
    );
  }

  async getCertificateById(
    certificateId: number,
    schoolId: number,
  ): Promise<any> {
    const certificate = await this.db.queryOne<Certificate>(
      `SELECT c.*, s.first_name_en, s.last_name_en, s.admission_number, s.date_of_birth_ad, s.date_of_birth_bs
       FROM certificates c
       LEFT JOIN students s ON c.student_id = s.student_id
       WHERE c.certificate_id = $1 AND c.school_id = $2`,
      [certificateId, schoolId],
    );

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    let details: any = null;

    if (certificate.certificate_type === 'TC') {
      details = await this.db.queryOne<TransferCertificate>(
        `SELECT * FROM transfer_certificates WHERE certificate_id = $1`,
        [certificateId],
      );
    } else if (certificate.certificate_type === 'BONAFIDE') {
      details = await this.db.queryOne<BonafideCertificate>(
        `SELECT * FROM bonafide_certificates WHERE certificate_id = $1`,
        [certificateId],
      );
    } else if (certificate.certificate_type === 'CHARACTER') {
      details = await this.db.queryOne<CharacterCertificate>(
        `SELECT * FROM character_certificates WHERE certificate_id = $1`,
        [certificateId],
      );
    }

    return { ...certificate, details };
  }

  async verifyBonafide(
    certificateId: number,
    verifiedBy: number,
  ): Promise<BonafideCertificate> {
    await this.db.query(
      `UPDATE bonafide_certificates SET is_verified = true, verified_by = $2, verified_at = NOW() WHERE certificate_id = $1`,
      [certificateId, verifiedBy],
    );

    const result = await this.db.queryOne<BonafideCertificate>(
      `SELECT * FROM bonafide_certificates WHERE certificate_id = $1`,
      [certificateId],
    );
    if (!result) {
      throw new NotFoundException('Certificate not found');
    }
    return result;
  }

  async verifyCharacter(
    certificateId: number,
    verifiedBy: number,
  ): Promise<CharacterCertificate> {
    await this.db.query(
      `UPDATE character_certificates SET is_verified = true, verified_by = $2, verified_at = NOW() WHERE certificate_id = $1`,
      [certificateId, verifiedBy],
    );

    const result = await this.db.queryOne<CharacterCertificate>(
      `SELECT * FROM character_certificates WHERE certificate_id = $1`,
      [certificateId],
    );
    if (!result) {
      throw new NotFoundException('Certificate not found');
    }
    return result;
  }

  async getTCsBySchool(
    schoolId: number,
    academicYear?: string,
  ): Promise<any[]> {
    let query = `SELECT tc.*, c.certificate_number, c.issued_date, s.first_name_en, s.last_name_en, s.admission_number, s.gender
                 FROM transfer_certificates tc
                 JOIN certificates c ON tc.certificate_id = c.certificate_id
                 JOIN students s ON tc.student_id = s.student_id
                 WHERE tc.school_id = $1`;
    const params: any[] = [schoolId];

    if (academicYear) {
      query += ` AND tc.last_academic_year = $2`;
      params.push(academicYear);
    }

    query += ` ORDER BY c.issued_date DESC`;

    return this.db.query(query, params);
  }
}
