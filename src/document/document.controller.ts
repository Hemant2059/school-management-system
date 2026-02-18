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

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @Roles('admin', 'teacher')
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
  async getDocumentById(
    @Param('id') id: number,
    @Req() req,
  ): Promise<Document> {
    return this.documentService.getDocumentById(id, req.user.schoolId);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteDocument(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.documentService.deleteDocument(id, req.user.schoolId);
    return { message: 'Document deleted successfully' };
  }

  @Get('certificate/:studentId/:type')
  @Roles('admin', 'student')
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
