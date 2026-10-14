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
} from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Exam Management')
@ApiBearerAuth()
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.EXAM_CREATE)
  @ApiOperation({
    summary: 'Create Exam',
    description: `Create a new examination for a specific class and subject.

**Features:**
- Support for multiple exam types (Unit Test, Terminal, Final, SEE, NEB, Board)
- Configurable marks structure
- Date and time scheduling
- Room allocation support

**Note:** Exam must be created before entering marks.`,
  })
  @ApiBody({
    description: 'Exam creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        examName: { type: 'string', example: 'First Terminal Exam 2081' },
        examType: {
          type: 'string',
          example: 'TERMINAL',
          enum: [
            'UNIT_TEST',
            'TERMINAL',
            'FINAL',
            'SEE',
            'NEB',
            'BOARD',
            'OTHER',
          ],
        },
        classId: { type: 'number', example: 10 },
        subjectId: { type: 'number', example: 1 },
        academicYear: { type: 'string', example: '2081-2082' },
        examDate: { type: 'string', example: '2081-08-15' },
        startTime: { type: 'string', example: '09:00' },
        endTime: { type: 'string', example: '12:00' },
        totalMarks: { type: 'number', example: 100 },
        passingMarks: { type: 'number', example: 35 },
        roomNumber: { type: 'string', example: 'Room 101' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Exam created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        examName: { type: 'string', example: 'First Terminal Exam 2081' },
        examType: { type: 'string', example: 'TERMINAL' },
        status: { type: 'string', example: 'SCHEDULED' },
        message: { type: 'string', example: 'Exam created successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(@Body() createDto: CreateExamDto) {
    return this.examService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.EXAM_READ)
  @ApiOperation({
    summary: 'Get All Exams',
    description: `Retrieve exams optionally filtered by class and exam type.

**Query Parameters:**
- schoolId: Required for filtering
- classId: Filter by class
- examType: Filter by exam type (UNIT_TEST, TERMINAL, FINAL, SEE, NEB, BOARD, OTHER)
- academicYear: Filter by academic year

**Note:** Results are sorted by exam date by default.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID (optional filter)',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'examType',
    description: 'Exam type (optional filter)',
    example: 'TERMINAL',
    enum: ['UNIT_TEST', 'TERMINAL', 'FINAL', 'SEE', 'NEB', 'BOARD', 'OTHER'],
    required: false,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year filter',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of exams retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          examName: { type: 'string', example: 'First Terminal Exam 2081' },
          examType: { type: 'string', example: 'TERMINAL' },
          classId: { type: 'number', example: 10 },
          examDate: { type: 'string', example: '2081-08-15' },
          totalMarks: { type: 'number', example: 100 },
          status: { type: 'string', example: 'SCHEDULED' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query('classId') classId?: number,
    @Query('examType') examType?: string,
  ) {
    return this.examService.findAll(schoolId, classId, examType);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.EXAM_READ)
  @ApiOperation({
    summary: 'Get Exam by ID',
    description: `Retrieve detailed information about a specific exam.

**Returns:**
- Exam details (name, type, date, time)
- Marks structure
- Assigned class and subject
- Status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)`,
  })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Exam details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        examName: { type: 'string', example: 'First Terminal Exam 2081' },
        examType: { type: 'string', example: 'TERMINAL' },
        classId: { type: 'number', example: 10 },
        subjectId: { type: 'number', example: 1 },
        examDate: { type: 'string', example: '2081-08-15' },
        startTime: { type: 'string', example: '09:00' },
        endTime: { type: 'string', example: '12:00' },
        totalMarks: { type: 'number', example: 100 },
        passingMarks: { type: 'number', example: 35 },
        status: { type: 'string', example: 'SCHEDULED' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.examService.findOne(id, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.EXAM_UPDATE)
  @ApiOperation({
    summary: 'Update Exam',
    description: `Update exam information such as date, time, or marks.

**Note:** All fields are optional. Only provide fields that need updating.

**Restrictions:**
- Cannot change exam type after marks are entered
- Date change will notify students if exam is scheduled
- Changes are logged for audit purposes`,
  })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    description: 'Exam update data',
    schema: {
      type: 'object',
      properties: {
        examName: { type: 'string', example: 'First Terminal Exam 2081' },
        examDate: { type: 'string', example: '2081-08-15' },
        startTime: { type: 'string', example: '09:00' },
        endTime: { type: 'string', example: '12:00' },
        totalMarks: { type: 'number', example: 100 },
        passingMarks: { type: 'number', example: 35 },
        roomNumber: { type: 'string', example: 'Room 101' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exam updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Exam updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateExamDto,
  ) {
    return this.examService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.EXAM_UPDATE)
  @ApiOperation({
    summary: 'Delete Exam',
    description: `Remove an exam from the system.

**Note:**
- Only exams without marks entered can be deleted
- Exam is soft deleted and can be recovered
- Related exam schedules are also removed
- All related data preserved for audit

**Important:** Contact administrator to delete exam with entered marks.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Exam deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Exam deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.examService.remove(id, schoolId);
  }
}
