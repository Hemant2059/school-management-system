import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

export interface Document {
  id?: number;
  schoolId: number;
  studentId?: number;
  teacherId?: number;
  staffId?: number;
  type:
    | 'student_photo'
    | 'certificate'
    | 'marksheet'
    | 'transfer_certificate'
    | 'id_card'
    | 'birth_certificate'
    | 'citizenship'
    | 'other';
  title: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: number;
  createdAt?: Date;
}

export interface CreateDocumentDto {
  studentId?: number;
  teacherId?: number;
  staffId?: number;
  type: Document['type'];
  title: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}

@Injectable()
export class DocumentService {
  private uploadPath: string;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || './uploads';
  }

  async createDocument(
    schoolId: number,
    uploadedBy: number,
    dto: CreateDocumentDto,
  ): Promise<Document> {
    const query = `
      INSERT INTO documents (
        school_id, student_id, teacher_id, staff_id, type, title,
        file_name, file_path, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      dto.studentId,
      dto.teacherId,
      dto.staffId,
      dto.type,
      dto.title,
      dto.fileName,
      dto.filePath,
      dto.fileSize,
      dto.mimeType,
      uploadedBy,
    ]);

    return result[0];
  }

  async getDocuments(
    schoolId: number,
    type?: string,
    entityId?: number,
    entityType?: 'student' | 'teacher' | 'staff',
  ): Promise<Document[]> {
    let query = 'SELECT * FROM documents WHERE school_id = $1';
    const params: any[] = [schoolId];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (entityType === 'student' && entityId) {
      params.push(entityId);
      query += ` AND student_id = $${params.length}`;
    } else if (entityType === 'teacher' && entityId) {
      params.push(entityId);
      query += ` AND teacher_id = $${params.length}`;
    } else if (entityType === 'staff' && entityId) {
      params.push(entityId);
      query += ` AND staff_id = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    return this.databaseService.query(query, params);
  }

  async getDocumentById(id: number, schoolId: number): Promise<Document> {
    const query =
      'SELECT * FROM documents WHERE document_id = $1 AND school_id = $2';
    const result = await this.databaseService.query(query, [id, schoolId]);

    if (!result[0]) {
      throw new NotFoundException('Document not found');
    }

    return result[0];
  }

  async deleteDocument(id: number, schoolId: number): Promise<void> {
    const query =
      'DELETE FROM documents WHERE document_id = $1 AND school_id = $2 RETURNING document_id';
    const result = await this.databaseService.query(query, [id, schoolId]);

    if (result.length === 0) {
      throw new NotFoundException('Document not found');
    }
  }

  async getStudentDocuments(
    schoolId: number,
    studentId: number,
  ): Promise<Document[]> {
    const query = `
      SELECT * FROM documents 
      WHERE school_id = $1 AND student_id = $2
      ORDER BY created_at DESC
    `;
    return this.databaseService.query(query, [schoolId, studentId]);
  }

  async getTeacherDocuments(
    schoolId: number,
    teacherId: number,
  ): Promise<Document[]> {
    const query = `
      SELECT * FROM documents 
      WHERE school_id = $1 AND teacher_id = $2
      ORDER BY created_at DESC
    `;
    return this.databaseService.query(query, [schoolId, teacherId]);
  }

  async generateCertificate(
    schoolId: number,
    studentId: number,
    certificateType: string,
  ): Promise<any> {
    const studentQuery = `
      SELECT s.*, c.class_name, sec.section_name, en.roll_no AS roll_number
      FROM students s
      LEFT JOIN enrollments en ON en.student_id = s.student_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = en.academic_year_id AND ay.is_current = true
      LEFT JOIN classes c ON en.class_id = c.class_id
      LEFT JOIN sections sec ON en.section_id = sec.section_id
      WHERE s.student_id = $1 AND s.school_id = $2
    `;

    const student = await this.databaseService.query(studentQuery, [
      studentId,
      schoolId,
    ]);

    if (!student[0]) {
      throw new NotFoundException('Student not found');
    }

    return {
      student: student[0],
      certificateType,
      issuedDate: new Date(),
      schoolId,
    };
  }
}
