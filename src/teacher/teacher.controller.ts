import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { Teacher } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Teacher Management')
@ApiBearerAuth()
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_CREATE)
  @ApiOperation({
    summary: 'Create New Teacher',
    description: `Register a new teacher in the system with comprehensive details.

**Features:**
- Bilingual name support (English & Nepali)
- Employee ID auto-generation option
- Qualification and experience tracking
- Department assignment
- Contact and address information

**Note:** After creation, teacher can be assigned to subjects and classes.`,
  })
  @ApiBody({
    description: 'Teacher creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        firstName: { type: 'string', example: 'गिरधारी' },
        firstNameEn: { type: 'string', example: 'Girdhari' },
        lastName: { type: 'string', example: 'पौडेल' },
        lastNameEn: { type: 'string', example: 'Poudel' },
        gender: {
          type: 'string',
          example: 'MALE',
          enum: ['MALE', 'FEMALE', 'OTHER'],
        },
        dateOfBirth: { type: 'string', example: '1985-05-15' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'teacher@school.edu.np' },
        qualification: { type: 'string', example: 'Masters in Education' },
        department: { type: 'string', example: 'Science' },
        joinedDate: { type: 'string', example: '2080-04-01' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Teacher created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        employeeId: { type: 'string', example: 'EMP-2024-0001' },
        firstNameEn: { type: 'string', example: 'Girdhari' },
        lastNameEn: { type: 'string', example: 'Poudel' },
        status: { type: 'string', example: 'ACTIVE' },
        message: { type: 'string', example: 'Teacher created successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or employee ID already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Employee ID already exists' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_READ)
  @ApiOperation({
    summary: 'Get All Teachers (Paginated)',
    description: `Retrieve paginated list of all teachers for a specific school.

**Query Parameters:**
- page, limit: Pagination options
- department: Filter by department
- status: Filter by teacher status (ACTIVE, INACTIVE, ON_LEAVE)
- search: Search by name or employee ID

**Note:** Results are sorted by employee ID by default.`,
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
    name: 'department',
    description: 'Department filter',
    example: 'Science',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Teacher status filter',
    example: 'ACTIVE',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of teachers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              employeeId: { type: 'string', example: 'EMP-2024-0001' },
              firstNameEn: { type: 'string', example: 'Girdhari' },
              lastNameEn: { type: 'string', example: 'Poudel' },
              department: { type: 'string', example: 'Science' },
              qualification: {
                type: 'string',
                example: 'Masters in Education',
              },
              status: { type: 'string', example: 'ACTIVE' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @GetUser('schoolId') schoolId: number,
  ): Promise<PageDto<Teacher>> {
    return this.teacherService.findAll(schoolId, pageOptionsDto);
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_READ)
  @ApiOperation({
    summary: 'Search Teachers',
    description: `Search teachers by name, employee ID, or department.

**Search Fields:**
- First name (English/Nepali)
- Last name (English/Nepali)
- Employee ID
- Department

**Use Case:** Quick teacher lookup for timetable, assignment, etc.`,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query string',
    example: 'Poudel',
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
          employeeId: { type: 'string', example: 'EMP-2024-0001' },
          firstNameEn: { type: 'string', example: 'Girdhari' },
          lastNameEn: { type: 'string', example: 'Poudel' },
          department: { type: 'string', example: 'Science' },
          status: { type: 'string', example: 'ACTIVE' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Query('q') query: string, @GetUser('schoolId') schoolId: number) {
    return this.teacherService.searchTeachers(schoolId, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_READ)
  @ApiOperation({
    summary: 'Get Teacher by ID',
    description: `Retrieve basic teacher information.

**Returns:**
- Basic personal details
- Department and qualifications
- Employment info
- Status`,
  })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        employeeId: { type: 'string', example: 'EMP-2024-0001' },
        firstNameEn: { type: 'string', example: 'Girdhari' },
        lastNameEn: { type: 'string', example: 'Poudel' },
        gender: { type: 'string', example: 'MALE' },
        dateOfBirth: { type: 'string', example: '1985-05-15' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'teacher@school.edu.np' },
        department: { type: 'string', example: 'Science' },
        qualification: { type: 'string', example: 'Masters in Education' },
        status: { type: 'string', example: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(+id);
  }

  @Get(':id/details')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_READ)
  @ApiOperation({
    summary: 'Get Complete Teacher Details',
    description: `Retrieve complete teacher information with all details.

**Includes:**
- Personal details (bilingual)
- Address information
- Qualifications and experience
- Department assignment
- Assigned subjects and classes
- Attendance summary

**Use Case:** Teacher profile view, comprehensive reports.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete teacher details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        employeeId: { type: 'string', example: 'EMP-2024-0001' },
        firstNameEn: { type: 'string', example: 'Girdhari' },
        lastNameEn: { type: 'string', example: 'Poudel' },
        firstName: { type: 'string', example: 'गिरधारी' },
        lastName: { type: 'string', example: 'पौडेल' },
        gender: { type: 'string', example: 'MALE' },
        dateOfBirth: { type: 'string', example: '1985-05-15' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'teacher@school.edu.np' },
        department: { type: 'string', example: 'Science' },
        qualification: { type: 'string', example: 'Masters in Education' },
        experience: { type: 'number', example: 10 },
        subjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'number' }, name: { type: 'string' } },
          },
        },
        classes: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'number' }, name: { type: 'string' } },
          },
        },
        status: { type: 'string', example: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  getDetails(@Param('id') id: string) {
    return this.teacherService.getTeacherWithDetails(+id);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_READ)
  @ApiOperation({
    summary: 'Get Teacher by Employee ID',
    description: `Lookup teacher using their unique employee identification number.

**Use Cases:**
- Quick teacher lookup at staff room
- ID card generation
- Payroll processing`,
  })
  @ApiParam({
    name: 'employeeId',
    description: 'Employee ID',
    example: 'EMP-2024-001',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher found successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        employeeId: { type: 'string', example: 'EMP-2024-0001' },
        firstNameEn: { type: 'string', example: 'Girdhari' },
        lastNameEn: { type: 'string', example: 'Poudel' },
        department: { type: 'string', example: 'Science' },
        status: { type: 'string', example: 'ACTIVE' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.teacherService.findByEmployeeId(employeeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_UPDATE)
  @ApiOperation({
    summary: 'Update Teacher',
    description: `Update teacher information.

**Note:** All fields are optional. Only provide fields that need updating.

**Restricted Fields:**
- Employee ID cannot be changed after creation
- Changes are logged for audit purposes`,
  })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    description: 'Teacher update data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'गिरधारी' },
        firstNameEn: { type: 'string', example: 'Girdhari' },
        lastName: { type: 'string', example: 'पौडेल' },
        lastNameEn: { type: 'string', example: 'Poudel' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'teacher@school.edu.np' },
        department: { type: 'string', example: 'Science' },
        qualification: { type: 'string', example: 'PhD in Education' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Teacher updated successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teacherService.update(+id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.TEACHER_DELETE)
  @ApiOperation({
    summary: 'Delete Teacher',
    description: `Soft delete a teacher record (marks as inactive).

**Note:**
- Does not permanently remove data
- Teacher status changed to INACTIVE
- All related data preserved
- Can be reversed by admin

**For permanent deletion, contact system administrator.**`,
  })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Teacher deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id') id: string) {
    return this.teacherService.remove(+id);
  }
}
