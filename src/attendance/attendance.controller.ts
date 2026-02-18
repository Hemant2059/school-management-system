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
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';

@ApiTags('Attendance Management')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @ApiOperation({
    summary: 'Record attendance',
    description: 'Record attendance for a single student.',
  })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Attendance recorded successfully',
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
  @ApiOperation({
    summary: 'Bulk record attendance',
    description: 'Record attendance for multiple students at once.',
  })
  @ApiBody({ type: BulkAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk attendance recorded successfully',
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
  @ApiOperation({
    summary: 'Get attendance records',
    description: 'Retrieve attendance records with optional filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query() getAttendanceDto: GetAttendanceDto,
  ) {
    return this.attendanceService.findAll(schoolId, getAttendanceDto);
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Get student attendance',
    description: 'Retrieve attendance records for a specific student.',
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
    example: '2024-01-01',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date filter (optional)',
    example: '2024-01-31',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Student attendance retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get student attendance statistics',
    description: 'Get attendance statistics for a student.',
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
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance statistics retrieved successfully',
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
