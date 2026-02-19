import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Export')
@ApiBearerAuth()
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('students')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_EXPORT)
  @ApiOperation({
    summary: 'Export Students Data',
    description: `Export student data to CSV or JSON format.

**Query Parameters:**
- schoolId: Required
- academicYear: Optional filter
- classId: Optional filter
- format: csv or json (default: csv)

**Includes:** Basic info, class, section, guardians`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format',
    example: 'csv',
    enum: ['csv', 'json'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Students exported',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        format: { type: 'string', example: 'csv' },
        fileName: { type: 'string', example: 'students-2081.csv' },
      },
    },
  })
  async exportStudents(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear?: string,
    @Query('classId') classId?: number,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    return this.exportService.exportStudents(
      schoolId,
      academicYear,
      classId,
      format,
    );
  }

  @Get('teachers')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_EXPORT)
  @ApiOperation({
    summary: 'Export Teachers Data',
    description: `Export teacher data to CSV or JSON format.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format',
    example: 'csv',
    enum: ['csv', 'json'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Teachers exported',
    schema: {
      type: 'object',
      properties: { data: { type: 'array' }, format: { type: 'string' } },
    },
  })
  async exportTeachers(
    @Query('schoolId') schoolId: number,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    return this.exportService.exportTeachers(schoolId, format);
  }

  @Get('attendance')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_EXPORT)
  @ApiOperation({
    summary: 'Export Attendance Data',
    description: `Export attendance records to CSV or JSON format.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date',
    example: '2081-04-01',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date',
    example: '2081-04-30',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format',
    example: 'csv',
    enum: ['csv', 'json'],
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Attendance exported' })
  async exportAttendance(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
    @Query('classId') classId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    return this.exportService.exportAttendance(
      schoolId,
      academicYear,
      classId,
      startDate,
      endDate,
      format,
    );
  }

  @Get('fees')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_EXPORT)
  @ApiOperation({
    summary: 'Export Fee Payments Data',
    description: `Export fee payment records to CSV or JSON format.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'format',
    description: 'Export format',
    example: 'csv',
    enum: ['csv', 'json'],
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Fee payments exported' })
  async exportFees(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
    @Query('classId') classId?: number,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    return this.exportService.exportFeePayments(
      schoolId,
      academicYear,
      classId,
      format,
    );
  }

  @Get('deo/:reportType')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_EXPORT)
  @ApiOperation({
    summary: 'Export DEO Compliance Report',
    description: `Export compliance report for District Education Office.

**Report Types:**
- STUDENT: Student enrollment report
- TEACHER: Teacher deployment report
- INFRASTRUCTURE: School infrastructure report`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiParam({
    name: 'reportType',
    description: 'Report type',
    example: 'STUDENT',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'DEO report exported' })
  async exportDEO(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
    @Param('reportType') reportType: string,
  ) {
    return this.exportService.exportDEOReport(
      schoolId,
      academicYear,
      reportType,
    );
  }
}
