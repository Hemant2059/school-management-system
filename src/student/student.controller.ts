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
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PageDto } from '../common/dto/page.dto';
import { Student } from './entities/student.entity';
import { GetStudentsDto } from './dto/get-students.dto';

@ApiTags('Student Management')
@ApiBearerAuth()
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new student',
    description:
      'Register a new student in the system with full details including bilingual names, addresses, and admission information.',
  })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
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
  @ApiOperation({
    summary: 'Get all students (paginated)',
    description:
      'Retrieve paginated list of all students for a specific school.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of students retrieved successfully',
    type: PageDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() getStudentsDto: GetStudentsDto): Promise<PageDto<Student>> {
    return this.studentService.findAll(getStudentsDto.schoolId, getStudentsDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search students',
    description: 'Search students by name, admission number, or roll number.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query string',
    example: 'Sharma',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(
    @Query('schoolId', ParseIntPipe) schoolId: number,
    @Query('q') query: string,
  ) {
    return this.studentService.searchStudents(schoolId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get student by ID',
    description: 'Retrieve basic student information.',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }

  @Get(':id/full')
  @ApiOperation({
    summary: 'Get complete student details',
    description:
      'Retrieve complete student information including guardians, enrollments, and attendance records.',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getFullDetails(@Param('id') id: string) {
    return this.studentService.getStudentWithFullDetails(+id);
  }

  @Get('admission/:admissionNumber')
  @ApiOperation({
    summary: 'Get student by admission number',
    description: 'Lookup student using their admission number.',
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
  })
  @ApiResponse({
    status: 200,
    description: 'Student found successfully',
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
  @ApiOperation({
    summary: 'Update student',
    description: 'Update student information. All fields are optional.',
  })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
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
  @ApiOperation({
    summary: 'Delete student',
    description: 'Soft delete a student record (marks as inactive).',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.studentService.remove(+id, userId);
  }
}
