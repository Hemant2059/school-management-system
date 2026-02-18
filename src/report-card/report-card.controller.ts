import { Controller, Post, Body, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
// ✅ FIXED: Use import type for Response
import type { FastifyReply } from 'fastify';
import { ReportCardService } from './report-card.service';

@ApiTags('Report Card Management')
@ApiBearerAuth()
@Controller('report-cards')
export class ReportCardController {
  constructor(private readonly reportCardService: ReportCardService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate student report card PDF',
    description:
      'Generate a downloadable bilingual PDF report card for a student.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studentName: { type: 'string', example: 'John Doe' },
        studentNameNp: { type: 'string', example: 'जोन डो' },
        className: { type: 'string', example: '10' },
        academicYear: { type: 'string', example: '2081-2082' },
        rollNumber: { type: 'number', example: 1 },
        percentage: { type: 'string', example: '85.5' },
        grade: { type: 'string', example: 'A' },
        gradePoint: { type: 'string', example: '3.6' },
        marks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subjectName: { type: 'string', example: 'Mathematics' },
              theoryMarks: { type: 'number', example: 75 },
              practicalMarks: { type: 'number', example: 20 },
              totalMarks: { type: 'number', example: 95 },
              grade: { type: 'string', example: 'A+' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'PDF report card generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'PDF generation failed' })
  async generateReportCard(@Body() body: any, @Res() res: FastifyReply) {
    try {
      const pdfBuffer =
        await this.reportCardService.generateBilingualReportCard(body);
      res.headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=report-card-${body.studentId || 'student'}.pdf`,
      });
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Preview report card data',
    description: 'Generate report card PDF buffer for preview purpose.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        studentName: { type: 'string', example: 'John Doe' },
        marks: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'PDF buffer generated successfully',
  })
  async previewReportCard(@Body() body: any) {
    return this.reportCardService.generateBilingualReportCard(body);
  }
}
