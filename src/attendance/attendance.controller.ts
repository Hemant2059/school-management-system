import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiExtraModels(CreateAttendanceDto, UpdateAttendanceDto, BulkAttendanceDto)
@ApiTags('Attendance Management')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_CREATE)
  @ApiOperation({
    summary: 'Record Attendance',
    description: `Record attendance for a single student.

**Status Options:**
- PRESENT: Student present
- ABSENT: Student absent without reason
- LATE: Arrived late
- LEAVE: On approved leave
- HOLIDAY: Holiday

**Note:** Cannot record attendance for future dates or holidays.`,
  })
  @ApiBody({
    description: 'Attendance record',
    schema: {
      type: 'object',
      required: ['studentId', 'date', 'status'],
      properties: {
        studentId: { type: 'number', example: 123 },
        date: { type: 'string', example: '2081-10-15' },
        status: {
          type: 'string',
          example: 'PRESENT',
          enum: ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HOLIDAY'],
        },
        remarks: { type: 'string', example: 'On time' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Attendance recorded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        date: { type: 'string', example: '2081-10-15' },
        status: { type: 'string', example: 'PRESENT' },
        message: {
          type: 'string',
          example: 'Attendance recorded successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or attendance already exists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateAttendanceDto,
    @GetUser('userId') userId: number,
  ) {
    return this.attendanceService.create(createDto, userId);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_CREATE)
  @ApiOperation({
    summary: 'Bulk Record Attendance',
    description: `Record attendance for multiple students at once.

**Use Cases:**
- Daily class attendance
- Bulk updates for a section
- Import from external systems

**Efficiency:** Processes up to 500 records per request.`,
  })
  @ApiBody({
    description: 'Bulk attendance data',
    schema: {
      type: 'object',
      required: ['date', 'classId', 'sectionId', 'records'],
      properties: {
        date: { type: 'string', example: '2081-10-15' },
        classId: { type: 'number', example: 10 },
        sectionId: { type: 'number', example: 1 },
        records: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'number', example: 1 },
              status: {
                type: 'string',
                example: 'PRESENT',
                enum: ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'],
              },
              remarks: {
                type: 'string',
                example: 'Sick leave',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk attendance recorded successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 50 },
        success: { type: 'number', example: 48 },
        failed: { type: 'number', example: 2 },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'number', example: 5 },
              message: { type: 'string', example: 'Already marked' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async createBulk(
    @Body() bulkDto: BulkAttendanceDto,
    @GetUser('userId') userId: number,
  ) {
    return this.attendanceService.createBulk(bulkDto, userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_READ)
  @ApiOperation({
    summary: 'Get Attendance Records',
    description: `Retrieve attendance records with optional filters.

**Filters:**
- schoolId: Required (from user context)
- classId, sectionId: Filter by class
- date, dateFrom, dateTo: Date range
- studentId: Specific student
- status: Attendance status
- academicYear: Academic year`,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'date',
    description: 'Specific date',
    example: '2081-10-15',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'dateFrom',
    description: 'Start date',
    example: '2081-10-01',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'dateTo',
    description: 'End date',
    example: '2081-10-31',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Attendance status',
    example: 'PRESENT',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          studentId: { type: 'number', example: 123 },
          studentName: { type: 'string', example: 'Ram Sharma' },
          date: { type: 'string', example: '2081-10-15' },
          status: { type: 'string', example: 'PRESENT' },
          remarks: { type: 'string', example: null },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query() getAttendanceDto: GetAttendanceDto,
  ) {
    return this.attendanceService.findAll(schoolId, getAttendanceDto);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_READ)
  @ApiOperation({
    summary: 'Get Student Attendance',
    description: `Retrieve attendance records for a specific student.

**Use Cases:**
- Parent/guardian inquiry
- Student profile attendance view
- Leave tracking`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date filter (optional)',
    example: '2081-10-01',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date filter (optional)',
    example: '2081-10-31',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Student attendance retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          date: { type: 'string', example: '2081-10-15' },
          status: { type: 'string', example: 'PRESENT' },
          remarks: { type: 'string', example: null },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.attendanceService.findByStudent(
      studentId,
      schoolId,
      start,
      end,
    );
  }

  @Get('student/:studentId/statistics')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_READ)
  @ApiOperation({
    summary: 'Get Student Attendance Statistics',
    description: `Get attendance statistics for a student.

**Statistics Include:**
- Total working days
- Present count
- Absent count
- Leave count
- Attendance percentage

**Use Cases:** Reports, parent meetings, leave analysis.`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        academicYear: { type: 'string', example: '2081-2082' },
        totalDays: { type: 'number', example: 180 },
        present: { type: 'number', example: 175 },
        absent: { type: 'number', example: 3 },
        late: { type: 'number', example: 2 },
        leave: { type: 'number', example: 2 },
        percentage: { type: 'number', example: 97.22 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStudentStatistics(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.attendanceService.getStudentStatistics(
      studentId,
      schoolId,
      academicYear,
    );
  }

  @Get('monthly-report')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_READ)
  @ApiOperation({
    summary: 'Get monthly attendance report',
    description:
      'Generate monthly attendance report in Nepali calendar format.',
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID',
    example: 2,
    type: Number,
  })
  @ApiQuery({
    name: 'nepaliYear',
    description: 'Nepali year (BS)',
    example: 2081,
    type: Number,
  })
  @ApiQuery({
    name: 'nepaliMonth',
    description: 'Nepali month (1-12)',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly report generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid month number' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMonthlyReport(
    @GetUser('schoolId') schoolId: number,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('sectionId', ParseIntPipe) sectionId: number,
    @Query('nepaliYear', ParseIntPipe) nepaliYear: number,
    @Query('nepaliMonth', ParseIntPipe) nepaliMonth: number,
    @Query('academicYear') academicYear: string,
  ) {
    if (nepaliMonth < 1 || nepaliMonth > 12) {
      throw new BadRequestException('Nepali month must be between 1 and 12');
    }
    return this.attendanceService.getMonthlyReport(
      schoolId,
      classId,
      sectionId,
      nepaliYear,
      nepaliMonth,
      academicYear,
    );
  }

  @Get('check-holiday')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_READ)
  @ApiOperation({
    summary: 'Check Nepal holiday',
    description: 'Check if a specific date is a Nepal public holiday.',
  })
  @ApiQuery({
    name: 'date',
    description: 'Date to check (AD format)',
    example: '2024-04-14',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Holiday status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  checkHoliday(@Query('date') dateStr: string) {
    const date = new Date(dateStr);
    const isHoliday = this.attendanceService.isNepalHoliday(date);
    return {
      date: dateStr,
      isHoliday,
      nepaliDate: NepaliDateUtil.adToBs(date).bsDate || '',
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_READ)
  @ApiOperation({
    summary: 'Get attendance by ID',
    description: 'Retrieve a specific attendance record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance record retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.attendanceService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.ATTENDANCE_CREATE)
  @ApiOperation({
    summary: 'Update attendance',
    description: 'Update an attendance record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({
    status: 200,
    description: 'Attendance updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateAttendanceDto,
    @GetUser('userId') userId: number,
  ) {
    return this.attendanceService.update(id, schoolId, updateDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ATTENDANCE_CREATE)
  @ApiOperation({
    summary: 'Delete attendance',
    description: 'Remove an attendance record.',
  })
  @ApiParam({
    name: 'id',
    description: 'Attendance ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.attendanceService.remove(id, schoolId);
  }
}
