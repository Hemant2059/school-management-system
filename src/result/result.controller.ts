import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ResultService } from './result.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiExtraModels()
@ApiBearerAuth()
@ApiTags('Results & Marks')
@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_ENTER)
  @ApiOperation({
    summary: 'Create Mark Entry',
    description: `Create a new mark entry for a student in an exam.

**Mark Components:**
- Theory marks
- Practical marks (if applicable)
- Assignment marks
- Internal assessment

**Note:** Can only enter marks before exam submission.`,
  })
  @ApiBody({
    description: 'Mark entry data',
    schema: {
      type: 'object',
      required: ['examId', 'studentId', 'marks'],
      properties: {
        examId: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        marks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subjectId: { type: 'number', example: 1 },
              theoryMarks: { type: 'number', example: 85 },
              practicalMarks: { type: 'number', example: 18 },
              assignmentMarks: { type: 'number', example: 5 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mark created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        examId: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        message: { type: 'string', example: 'Mark entry created successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid marks or exam not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(@Body() createDto: any) {
    return this.resultService.create(createDto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_ENTER)
  @ApiOperation({
    summary: 'Bulk Create/Update Marks',
    description: `Bulk create or update marks for multiple students.

**Use Cases:**
- Enter marks for entire class after exam
- Bulk corrections
- Import from external systems

**Note:** Updates existing marks if already entered.`,
  })
  @ApiBody({
    description: 'Bulk marks data',
    schema: {
      type: 'object',
      required: ['examId', 'marks'],
      properties: {
        examId: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        marks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studentId: { type: 'number', example: 1 },
              marks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    subjectId: { type: 'number', example: 1 },
                    theoryMarks: { type: 'number', example: 85 },
                    practicalMarks: { type: 'number', example: 18 },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Marks created/updated successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 50 },
        success: { type: 'number', example: 48 },
        failed: { type: 'number', example: 2 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createBulk(@Body() createDto: any) {
    return this.resultService.createBulk(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_READ)
  @ApiOperation({
    summary: 'Get All Marks for an Exam',
    description: `Retrieve all marks for a specific exam.

**Includes:**
- All students marks
- Subject-wise breakdown
- Pass/fail status`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'examId',
    description: 'Exam ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of marks',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          studentId: { type: 'number', example: 123 },
          studentName: { type: 'string', example: 'Ram Sharma' },
          rollNumber: { type: 'number', example: 1 },
          marks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subjectId: { type: 'number', example: 1 },
                subjectName: { type: 'string', example: 'English' },
                theoryMarks: { type: 'number', example: 85 },
                practicalMarks: { type: 'number', example: 18 },
                totalMarks: { type: 'number', example: 103 },
              },
            },
          },
          totalMarks: { type: 'number', example: 750 },
          percentage: { type: 'number', example: 83.33 },
          grade: { type: 'string', example: 'A' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('schoolId') schoolId: number,
    @Query('examId') examId: number,
  ) {
    return this.resultService.findAll(schoolId, examId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_READ)
  @ApiOperation({
    summary: 'Get Marks for a Student',
    description: `Retrieve marks for a specific student.

**Filters:**
- academicYear: Filter by year
- examId: Specific exam (optional)`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
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
    name: 'examId',
    description: 'Exam ID',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Student marks',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          examId: { type: 'number', example: 1 },
          examName: { type: 'string', example: 'Terminal Exam 2081' },
          totalMarks: { type: 'number', example: 750 },
          obtainedMarks: { type: 'number', example: 625 },
          percentage: { type: 'number', example: 83.33 },
          grade: { type: 'string', example: 'A' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByStudent(
    @Param('studentId') studentId: number,
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.resultService.findByStudent(studentId, schoolId, academicYear);
  }

  @Get('exam/:examId/student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_READ)
  @ApiOperation({
    summary: 'Get Student Result for Exam',
    description: `Retrieve detailed result for a student in a specific exam.

**Includes:**
- Subject-wise marks
- Total and percentage
- Grade and GPA
- Class rank (if available)`,
  })
  @ApiParam({
    name: 'examId',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student result with summary',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        examId: { type: 'number', example: 1 },
        examName: { type: 'string', example: 'Terminal Examination 2081' },
        totalMarks: { type: 'number', example: 750 },
        obtainedMarks: { type: 'number', example: 625 },
        percentage: { type: 'number', example: 83.33 },
        grade: { type: 'string', example: 'A' },
        gradePoint: { type: 'number', example: 3.6 },
        rank: { type: 'number', example: 5 },
        subjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subjectId: { type: 'number', example: 1 },
              subjectName: { type: 'string', example: 'English' },
              fullMarks: { type: 'number', example: 100 },
              obtainedMarks: { type: 'number', example: 85 },
              grade: { type: 'string', example: 'A' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  getStudentResult(
    @Param('examId') examId: number,
    @Param('studentId') studentId: number,
  ) {
    return this.resultService.getStudentResult(studentId, examId);
  }

  @Get('class')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_READ)
  @ApiOperation({
    summary: 'Get Class Results for Exam',
    description: `Retrieve class-wise results for an exam.

**Statistics:**
- Total students
- Pass/fail counts
- Pass percentage
- Grade distribution
- Highest/lowest/average marks`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'examId',
    description: 'Exam ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID (optional)',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Class results',
    schema: {
      type: 'object',
      properties: {
        examId: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        totalStudents: { type: 'number', example: 50 },
        appeared: { type: 'number', example: 48 },
        passed: { type: 'number', example: 45 },
        failed: { type: 'number', example: 3 },
        passPercentage: { type: 'number', example: 93.75 },
        highestMarks: { type: 'number', example: 780 },
        lowestMarks: { type: 'number', example: 280 },
        averageMarks: { type: 'number', example: 580 },
        gradeDistribution: {
          type: 'object',
          properties: {
            'A+': { type: 'number', example: 10 },
            A: { type: 'number', example: 15 },
            'B+': { type: 'number', example: 12 },
            B: { type: 'number', example: 8 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getClassResult(
    @Query('schoolId') schoolId: number,
    @Query('examId') examId: number,
    @Query('classId') classId?: number,
  ) {
    return this.resultService.getClassResult(schoolId, examId, classId);
  }

  @Get('student/:studentId/gpa')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_READ)
  @ApiOperation({
    summary: 'Calculate Student GPA',
    description: `Calculate GPA for a student in an academic year.

**Calculation Based On:**
- Grade points for each subject
- Credit hours/weights
- NEB grading system

**Returns:**
- GPA value (0-4.0)
- Total credits
- Grade points
- Class rank`,
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
    description: 'GPA value',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        academicYear: { type: 'string', example: '2081-2082' },
        gpa: { type: 'number', example: 3.4 },
        totalCredits: { type: 'number', example: 120 },
        gradePoints: { type: 'number', example: 408 },
        rank: { type: 'number', example: 15 },
        totalStudents: { type: 'number', example: 50 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  calculateGPA(
    @Param('studentId') studentId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.resultService.calculateGPA(studentId, academicYear);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_READ)
  @ApiOperation({ summary: 'Get a mark by ID' })
  @ApiResponse({ status: 200, description: 'Mark details' })
  findOne(@Param('id') id: number) {
    return this.resultService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_ENTER)
  @ApiOperation({ summary: 'Update a mark' })
  @ApiResponse({ status: 200, description: 'Mark updated' })
  update(@Param('id') id: number, @Body() updateDto: any) {
    return this.resultService.update(id, updateDto);
  }

  @Post(':examId/submit')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.RESULT_PUBLISH)
  @ApiOperation({
    summary: 'Submit Exam Marks',
    description: `Submit exam marks for review.

**Workflow:**
1. Teacher enters all marks
2. Submit for admin review
3. Status changes to SUBMITTED
4. Admin verifies marks

**Note:** After submission, marks cannot be edited without admin approval.`,
  })
  @ApiParam({
    name: 'examId',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Marks submitted',
    schema: {
      type: 'object',
      properties: {
        examId: { type: 'number', example: 1 },
        status: { type: 'string', example: 'SUBMITTED' },
        submittedAt: { type: 'string', example: '2081-10-30T10:00:00Z' },
        submittedBy: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'No marks entered or already submitted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  submit(@Param('examId') examId: number) {
    return this.resultService.submit(examId);
  }

  @Post(':examId/verify')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.RESULT_PUBLISH)
  @ApiOperation({
    summary: 'Verify Exam Marks',
    description: `Verify and approve submitted exam marks.

**Workflow:**
1. Admin reviews submitted marks
2. Verify accuracy
3. Status changes to VERIFIED
4. Marks can now be published to students/parents

**Note:** This is a critical action. Verify only after thorough review.`,
  })
  @ApiParam({
    name: 'examId',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Marks verified',
    schema: {
      type: 'object',
      properties: {
        examId: { type: 'number', example: 1 },
        status: { type: 'string', example: 'VERIFIED' },
        verifiedAt: { type: 'string', example: '2081-10-31T14:00:00Z' },
        verifiedBy: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Marks not submitted or already verified',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  verify(@Param('examId') examId: number) {
    return this.resultService.verify(examId);
  }
}
