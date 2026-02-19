import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import type { CreateDocumentDto, Document } from './document.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Upload Document',
    description: `Upload a document for a student, teacher, or staff.

**Features:**
- Support for images, PDFs
- Automatic file type validation
- Storage in cloud/local
- Document type categorization`,
  })
  @ApiBody({
    description: 'Document data',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'PHOTO' },
        entityId: { type: 'number', example: 123 },
        entityType: { type: 'string', example: 'student' },
        fileName: { type: 'string', example: 'photo.jpg' },
        fileUrl: { type: 'string', example: '/uploads/photo.jpg' },
        fileSize: { type: 'number', example: 1024000 },
        mimeType: { type: 'string', example: 'image/jpeg' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        fileName: { type: 'string', example: 'photo.jpg' },
        message: { type: 'string', example: 'Document uploaded successfully' },
      },
    },
  })
  async createDocument(
    @Body() dto: CreateDocumentDto,
    @Req() req,
  ): Promise<Document> {
    return this.documentService.createDocument(
      req.user.schoolId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get Documents',
    description: `Get documents filtered by type, entity ID, and entity type.`,
  })
  @ApiQuery({
    name: 'type',
    description: 'Document type',
    example: 'PHOTO',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'entityId',
    description: 'Entity ID',
    example: 123,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'entityType',
    description: 'Entity type',
    example: 'student',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          fileName: { type: 'string', example: 'photo.jpg' },
          type: { type: 'string', example: 'PHOTO' },
        },
      },
    },
  })
  async getDocuments(
    @Query('type') type: string,
    @Query('entityId') entityId: number,
    @Query('entityType') entityType: 'student' | 'teacher' | 'staff',
    @Req() req,
  ): Promise<Document[]> {
    return this.documentService.getDocuments(
      req.user.schoolId,
      type,
      entityId,
      entityType,
    );
  }

  @Get('student/:studentId')
  @Roles('admin', 'teacher', 'student')
  @ApiOperation({
    summary: 'Get Student Documents',
    description: `Get all documents for a specific student.`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student documents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          fileName: { type: 'string', example: 'photo.jpg' },
          type: { type: 'string', example: 'PHOTO' },
          uploadedAt: { type: 'string', example: '2081-04-15' },
        },
      },
    },
  })
  async getStudentDocuments(
    @Param('studentId') studentId: number,
    @Req() req,
  ): Promise<Document[]> {
    return this.documentService.getStudentDocuments(
      req.user.schoolId,
      studentId,
    );
  }

  @Get('teacher/:teacherId')
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Get Teacher Documents',
    description: `Get all documents for a specific teacher.`,
  })
  @ApiParam({
    name: 'teacherId',
    description: 'Teacher ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher documents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          fileName: { type: 'string', example: 'certificate.pdf' },
          type: { type: 'string', example: 'CERTIFICATE' },
        },
      },
    },
  })
  async getTeacherDocuments(
    @Param('teacherId') teacherId: number,
    @Req() req,
  ): Promise<Document[]> {
    return this.documentService.getTeacherDocuments(
      req.user.schoolId,
      teacherId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Document by ID',
    description: `Get document details by ID.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        fileName: { type: 'string', example: 'photo.jpg' },
        fileUrl: { type: 'string', example: '/uploads/photo.jpg' },
        type: { type: 'string', example: 'PHOTO' },
      },
    },
  })
  async getDocumentById(
    @Param('id') id: number,
    @Req() req,
  ): Promise<Document> {
    return this.documentService.getDocumentById(id, req.user.schoolId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete Document',
    description: `Delete a document from the system.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Document ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Document deleted successfully' },
      },
    },
  })
  async deleteDocument(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.documentService.deleteDocument(id, req.user.schoolId);
    return { message: 'Document deleted successfully' };
  }

  @Get('certificate/:studentId/:type')
  @Roles('admin', 'student')
  @ApiOperation({
    summary: 'Generate Certificate',
    description: `Generate a certificate for a student.

**Certificate Types:**
- TC: Transfer Certificate
- BONAFIDE: Bonafide Certificate
- CHARACTER: Character Certificate`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiParam({
    name: 'type',
    description: 'Certificate type',
    example: 'BONAFIDE',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate generated',
    schema: {
      type: 'object',
      properties: {
        certificateUrl: {
          type: 'string',
          example: '/certificates/bf-2024-001.pdf',
        },
      },
    },
  })
  async generateCertificate(
    @Param('studentId') studentId: number,
    @Param('type') type: string,
    @Req() req,
  ) {
    return this.documentService.generateCertificate(
      req.user.schoolId,
      studentId,
      type,
    );
  }
}
