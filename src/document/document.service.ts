import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  titleNp?: string;
  description?: string;
  descriptionNp?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}

export interface DocumentTemplate {
  id?: number;
  school_id: number | null;
  name: string;
  name_np: string | null;
  template_type: string | null;
  template_content: string | null;
  template_content_np: string | null;
  is_active: boolean;
  created_at?: Date;
}

export interface CreateDocumentTemplateDto {
  schoolId?: number;
  name: string;
  nameNp?: string;
  templateType?: string;
  templateContent?: string;
  templateContentNp?: string;
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
        school_id, student_id, teacher_id, staff_id, type, title, title_np,
        description, description_np,
        file_name, file_path, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      dto.studentId,
      dto.teacherId,
      dto.staffId,
      dto.type,
      dto.title,
      (dto as any).titleNp || null,
      (dto as any).description || null,
      (dto as any).descriptionNp || null,
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

  // ---- Document templates (admin-managed; EN+NP stored verbatim) ----
  async createTemplate(
    schoolId: number,
    dto: CreateDocumentTemplateDto,
  ): Promise<DocumentTemplate> {
    const dup = await this.databaseService.queryOne<DocumentTemplate>(
      `SELECT id FROM document_templates WHERE school_id = $1 AND name = $2`,
      [schoolId, dto.name],
    );
    if (dup) {
      throw new BadRequestException(
        `Document template '${dto.name}' already exists for this school`,
      );
    }
    const result = await this.databaseService.query(
      `INSERT INTO document_templates (school_id, name, name_np, template_type, template_content, template_content_np, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [
        schoolId,
        dto.name,
        dto.nameNp || null,
        dto.templateType || null,
        dto.templateContent || null,
        dto.templateContentNp || null,
      ],
    );
    return result[0];
  }

  async getTemplates(schoolId: number): Promise<DocumentTemplate[]> {
    return this.databaseService.query(
      `SELECT * FROM document_templates WHERE school_id = $1 AND is_active = true ORDER BY name ASC`,
      [schoolId],
    );
  }

  async updateTemplate(
    id: number,
    schoolId: number,
    dto: Partial<CreateDocumentTemplateDto> & { isActive?: boolean },
  ): Promise<DocumentTemplate> {
    const fieldMap: Record<string, string> = {
      name: 'name',
      nameNp: 'name_np',
      templateType: 'template_type',
      templateContent: 'template_content',
      templateContentNp: 'template_content_np',
      isActive: 'is_active',
    };
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      const v = (dto as any)[key];
      if (v !== undefined) {
        updates.push(`${col} = $${i++}`);
        params.push(v);
      }
    }
    if (updates.length === 0) {
      return this.getTemplateById(id, schoolId);
    }
    params.push(id, schoolId);
    const result = await this.databaseService.query(
      `UPDATE document_templates SET ${updates.join(', ')} WHERE id = $${i} AND school_id = $${i + 1} RETURNING *`,
      params,
    );
    if (!result[0]) {
      throw new NotFoundException('Document template not found');
    }
    return result[0];
  }

  async getTemplateById(id: number, schoolId: number): Promise<DocumentTemplate> {
    const result = await this.databaseService.query(
      `SELECT * FROM document_templates WHERE id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (!result[0]) {
      throw new NotFoundException('Document template not found');
    }
    return result[0];
  }

  async deleteTemplate(id: number, schoolId: number): Promise<void> {
    const result = await this.databaseService.query(
      `UPDATE document_templates SET is_active = false WHERE id = $1 AND school_id = $2 RETURNING id`,
      [id, schoolId],
    );
    if (result.length === 0) {
      throw new NotFoundException('Document template not found');
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
