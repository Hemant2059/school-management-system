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
  ApiExtraModels,
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PageDto } from '../common/dto/page.dto';
import { Student } from './student.service';
import { GetStudentsDto } from './dto/get-students.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiExtraModels(CreateStudentDto, UpdateStudentDto)
@ApiTags('Student Management')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.STUDENT_CREATE)
  @ApiOperation({
    summary: 'Create New Student',
    description: `Register a new student in the system with full details.

**Features:**
- Bilingual name support (English & Nepali)
- Address with Nepal-specific fields (Province, District, Municipality, Ward)
- Guardian information linking
- Admission number auto-generation option
- Academic year tracking

**Note:** After creation, student can be assigned to classes and sections.`,
  })
  @ApiBody({
    description: 'Student creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        firstName: { type: 'string', example: 'राम' },
        firstNameEn: { type: 'string', example: 'Ram' },
        lastName: { type: 'string', example: 'शर्मा' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        gender: {
          type: 'string',
          example: 'MALE',
          enum: ['MALE', 'FEMALE', 'OTHER'],
        },
        dateOfBirth: { type: 'string', example: '2015-01-15' },
        bloodGroup: { type: 'string', example: 'A_POSITIVE' },
        admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
        rollNumber: { type: 'number', example: 1 },
        academicYear: { type: 'string', example: '2081-2082' },
        classId: { type: 'number', example: 10 },
        sectionId: { type: 'number', example: 1 },
        admissionDate: { type: 'string', example: '2081-04-01' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Ram' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
        status: { type: 'string', example: 'ACTIVE' },
        message: { type: 'string', example: 'Student created successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createStudentDto: CreateStudentDto,
    @GetUser('userId') userId: number,
  ) {
    return this.studentService.create(createStudentDto, userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.STUDENT_READ)
  @ApiOperation({
    summary: 'Get All Students (Paginated)',
    description: `Retrieve paginated list of all students for a specific school.

**Query Parameters:**
- schoolId: Required for filtering
- page, limit: Pagination options
- classId, sectionId: Filter by class/section
- academicYear: Filter by academic year
- status: Filter by student status (ACTIVE, INACTIVE, TRANSFERRED)
- search: Search by name or admission number

**Note:** Results are sorted by roll number by default.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    example: 20,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID filter',
    example: 10,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID filter',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year filter',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Student status',
    example: 'ACTIVE',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search query',
    example: 'Ram',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of students retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              firstNameEn: { type: 'string', example: 'Ram' },
              lastNameEn: { type: 'string', example: 'Sharma' },
              admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
              rollNumber: { type: 'number', example: 1 },
              class: { type: 'string', example: 'Grade 10' },
              section: { type: 'string', example: 'A' },
              status: { type: 'string', example: 'ACTIVE' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() getStudentsDto: GetStudentsDto): Promise<PageDto<Student>> {
    return this.studentService.findAll(getStudentsDto.schoolId, getStudentsDto);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.STUDENT_READ)
  @ApiOperation({
    summary: 'Search Students',
    description: `Search students by name, admission number, or roll number.

**Search Fields:**
- First name (English/Nepali)
- Last name (English/Nepali)
- Admission number
- Roll number

**Use Case:** Quick student lookup for attendance, marks entry, etc.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query string',
    example: 'Sharma',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          firstNameEn: { type: 'string', example: 'Ram' },
          lastNameEn: { type: 'string', example: 'Sharma' },
          admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
          rollNumber: { type: 'number', example: 1 },
          class: { type: 'string', example: 'Grade 10' },
          section: { type: 'string', example: 'A' },
          status: { type: 'string', example: 'ACTIVE' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(
    @Query('schoolId', ParseIntPipe) schoolId: number,
    @Query('q') query: string,
  ) {
    return this.studentService.searchStudents(schoolId, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.STUDENT_READ)
  @ApiOperation({
    summary: 'Get Student by ID',
    description: `Retrieve basic student information.

**Returns:**
- Basic personal details
- Class and section assignment
- Academic year info
- Status`,
  })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Ram' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
        rollNumber: { type: 'number', example: 1 },
        gender: { type: 'string', example: 'MALE' },
        dateOfBirth: { type: 'string', example: '2015-01-15' },
        class: {
          type: 'object',
          properties: { id: { type: 'number' }, name: { type: 'string' } },
        },
        section: {
          type: 'object',
          properties: { id: { type: 'number' }, name: { type: 'string' } },
        },
        status: { type: 'string', example: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }

  @Get(':id/full')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.STUDENT_READ)
  @ApiOperation({
    summary: 'Get Complete Student Details',
    description: `Retrieve complete student information.

**Includes:**
- Personal details (bilingual)
- Address information
- Guardian details and relationships
- Class enrollments history
- Attendance summary
- Fee payment status
- Academic performance

**Use Case:** Student profile view, comprehensive reports.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete student details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Ram' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        firstName: { type: 'string', example: 'राम' },
        lastName: { type: 'string', example: 'शर्मा' },
        admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
        gender: { type: 'string', example: 'MALE' },
        dateOfBirth: { type: 'string', example: '2015-01-15' },
        bloodGroup: { type: 'string', example: 'A_POSITIVE' },
        class: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 10 },
            name: { type: 'string', example: 'Grade 10' },
          },
        },
        section: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'A' },
          },
        },
        guardians: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              firstName: { type: 'string', example: 'श्याम' },
              lastName: { type: 'string', example: 'शर्मा' },
              mobile: { type: 'string', example: '9841234567' },
              relation: { type: 'string', example: 'FATHER' },
            },
          },
        },
        attendance: {
          type: 'object',
          properties: {
            totalDays: { type: 'number', example: 180 },
            present: { type: 'number', example: 175 },
            absent: { type: 'number', example: 3 },
            leave: { type: 'number', example: 2 },
            percentage: { type: 'number', example: 97.22 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getFullDetails(@Param('id') id: string) {
    return this.studentService.getStudentWithFullDetails(+id);
  }

  @Get('admission/:admissionNumber')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.STUDENT_READ)
  @ApiOperation({
    summary: 'Get Student by Admission Number',
    description: `Lookup student using their unique admission number.

**Use Cases:**
- Quick student lookup at reception
- Verification during fee payment
- ID card generation`,
  })
  @ApiParam({
    name: 'admissionNumber',
    description: 'Admission number',
    example: 'ADM-2024-001',
    type: String,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Student found successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Ram' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
        class: { type: 'string', example: 'Grade 10' },
        section: { type: 'string', example: 'A' },
        status: { type: 'string', example: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findByAdmissionNumber(
    @Param('admissionNumber') admissionNumber: string,
    @Query('schoolId', ParseIntPipe) schoolId: number,
  ) {
    return this.studentService.findByAdmissionNumber(admissionNumber, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.STUDENT_UPDATE)
  @ApiOperation({
    summary: 'Update Student',
    description: `Update student information.

**Note:** All fields are optional. Only provide fields that need updating.

**Restricted Fields:**
- admissionNumber cannot be changed after creation
- Changes are logged for audit purposes`,
  })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    description: 'Student update data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'राम' },
        firstNameEn: { type: 'string', example: 'Ram' },
        lastName: { type: 'string', example: 'शर्मा' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'ram@email.com' },
        bloodGroup: { type: 'string', example: 'A_POSITIVE' },
        classId: { type: 'number', example: 10 },
        sectionId: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Student updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @GetUser('userId') userId: number,
  ) {
    return this.studentService.update(+id, updateStudentDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.STUDENT_DELETE)
  @ApiOperation({
    summary: 'Delete Student',
    description: `Soft delete a student record (marks as inactive).

**Note:**
- Does not permanently remove data
- Student status changed to INACTIVE
- All related data preserved
- Can be reversed by admin

**For permanent deletion, contact system administrator.**`,
  })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Student deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.studentService.remove(+id, userId);
  }
}
