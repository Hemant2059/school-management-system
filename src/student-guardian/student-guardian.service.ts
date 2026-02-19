import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface StudentGuardian {
  student_guardian_id: number;
  student_id: number;
  guardian_id: number;
  relationship_type: string;
  is_primary: boolean;
  is_emergency_contact: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class StudentGuardianService {
  constructor(private db: DatabaseService) {}

  async linkGuardian(createDto: {
    studentId: number;
    guardianId: number;
    schoolId: number;
    relationshipType: string;
    isPrimary?: boolean;
    isEmergencyContact?: boolean;
  }): Promise<StudentGuardian> {
    const student = await this.db.queryOne(
      `SELECT * FROM students WHERE student_id = $1 AND school_id = $2 AND is_active = true`,
      [createDto.studentId, createDto.schoolId],
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const guardian = await this.db.queryOne(
      `SELECT * FROM guardians WHERE guardian_id = $1 AND school_id = $2 AND is_active = true`,
      [createDto.guardianId, createDto.schoolId],
    );
    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    const existing = await this.db.queryOne<StudentGuardian>(
      `SELECT * FROM student_guardians WHERE student_id = $1 AND guardian_id = $2 AND is_active = true`,
      [createDto.studentId, createDto.guardianId],
    );
    if (existing) {
      throw new BadRequestException(
        'Guardian is already linked to this student',
      );
    }

    if (createDto.isPrimary) {
      await this.db.query(
        `UPDATE student_guardians SET is_primary = false WHERE student_id = $1`,
        [createDto.studentId],
      );
    }

    if (createDto.isEmergencyContact) {
      await this.db.query(
        `UPDATE student_guardians SET is_emergency_contact = false WHERE student_id = $1`,
        [createDto.studentId],
      );
    }

    return this.db.insert<StudentGuardian>(
      `INSERT INTO student_guardians (student_id, guardian_id, relationship_type, is_primary, is_emergency_contact, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [
        createDto.studentId,
        createDto.guardianId,
        createDto.relationshipType,
        createDto.isPrimary || false,
        createDto.isEmergencyContact || false,
      ],
    );
  }

  async unlinkGuardian(
    studentId: number,
    guardianId: number,
    _schoolId: number,
  ): Promise<void> {
    const link = await this.db.queryOne<StudentGuardian>(
      `SELECT * FROM student_guardians WHERE student_id = $1 AND guardian_id = $2 AND is_active = true`,
      [studentId, guardianId],
    );

    if (!link) {
      throw new NotFoundException('Guardian link not found');
    }

    await this.db.query(
      `UPDATE student_guardians SET is_active = false WHERE student_guardian_id = $1`,
      [link.student_guardian_id],
    );
  }

  async findGuardiansByStudent(
    studentId: number,
    schoolId: number,
  ): Promise<any[]> {
    return this.db.query(
      `SELECT sg.*, g.* 
       FROM student_guardians sg
       JOIN guardians g ON sg.guardian_id = g.guardian_id
       WHERE sg.student_id = $1 AND g.school_id = $2 AND sg.is_active = true
       ORDER BY sg.is_primary DESC`,
      [studentId, schoolId],
    );
  }

  async findStudentsByGuardian(
    guardianId: number,
    schoolId: number,
  ): Promise<any[]> {
    return this.db.query(
      `SELECT sg.*, s.* 
       FROM student_guardians sg
       JOIN students s ON sg.student_id = s.student_id
       WHERE sg.guardian_id = $1 AND s.school_id = $2 AND sg.is_active = true
       ORDER BY s.first_name_en`,
      [guardianId, schoolId],
    );
  }

  async getPrimaryGuardian(studentId: number, schoolId: number): Promise<any> {
    return this.db.queryOne(
      `SELECT g.* 
       FROM student_guardians sg
       JOIN guardians g ON sg.guardian_id = g.guardian_id
       WHERE sg.student_id = $1 AND g.school_id = $2 AND sg.is_primary = true AND sg.is_active = true`,
      [studentId, schoolId],
    );
  }

  async updateGuardianLink(
    studentId: number,
    guardianId: number,
    schoolId: number,
    updateDto: {
      relationshipType?: string;
      isPrimary?: boolean;
      isEmergencyContact?: boolean;
    },
  ): Promise<StudentGuardian> {
    const link = await this.db.queryOne<StudentGuardian>(
      `SELECT * FROM student_guardians WHERE student_id = $1 AND guardian_id = $2 AND is_active = true`,
      [studentId, guardianId],
    );

    if (!link) {
      throw new NotFoundException('Guardian link not found');
    }

    if (updateDto.isPrimary) {
      await this.db.query(
        `UPDATE student_guardians SET is_primary = false WHERE student_id = $1`,
        [studentId],
      );
    }

    if (updateDto.isEmergencyContact) {
      await this.db.query(
        `UPDATE student_guardians SET is_emergency_contact = false WHERE student_id = $1`,
        [studentId],
      );
    }

    await this.db.query(
      `UPDATE student_guardians SET 
        relationship_type = COALESCE($3, relationship_type),
        is_primary = COALESCE($4, is_primary),
        is_emergency_contact = COALESCE($5, is_emergency_contact),
        updated_at = NOW()
       WHERE student_guardian_id = $1`,
      [
        link.student_guardian_id,
        schoolId,
        updateDto.relationshipType || null,
        updateDto.isPrimary ?? null,
        updateDto.isEmergencyContact ?? null,
      ],
    );

    return this.db.queryOne<StudentGuardian>(
      `SELECT * FROM student_guardians WHERE student_guardian_id = $1`,
      [link.student_guardian_id],
    ) as Promise<StudentGuardian>;
  }
}
