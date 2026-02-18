import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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

@ApiTags('Teacher Management')
@ApiBearerAuth()
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new teacher',
    description:
      'Register a new teacher in the system with bilingual name support, qualifications, and employment details.',
  })
  @ApiBody({ type: CreateTeacherDto })
  @ApiResponse({
    status: 201,
    description: 'Teacher created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all teachers (paginated)',
    description: 'Retrieve paginated list of all teachers in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of teachers retrieved successfully',
    type: PageDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query() pageOptionsDto: PageOptionsDto,
    @GetUser('schoolId') schoolId: number,
  ): Promise<PageDto<Teacher>> {
    return this.teacherService.findAll(schoolId, pageOptionsDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search teachers',
    description:
      'Search teachers by name, employee ID, or department using query parameter.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query string',
    example: 'Sharma',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Query('q') query: string, @GetUser('schoolId') schoolId: number) {
    return this.teacherService.searchTeachers(schoolId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get teacher by ID',
    description: 'Retrieve detailed information about a specific teacher.',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(+id);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get complete teacher details',
    description:
      'Retrieve teacher information with complete details including subjects, classes, and assignments.',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  getDetails(@Param('id') id: string) {
    return this.teacherService.getTeacherWithDetails(+id);
  }

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Get teacher by employee ID',
    description: 'Lookup teacher using their employee identification number.',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.teacherService.findByEmployeeId(employeeId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update teacher',
    description: 'Update teacher information. All fields are optional.',
  })
  @ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateTeacherDto })
  @ApiResponse({
    status: 200,
    description: 'Teacher updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teacherService.update(+id, updateTeacherDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete teacher',
    description: 'Soft delete a teacher record (marks as inactive).',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id') id: string) {
    return this.teacherService.remove(+id);
  }
}
