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
  Request,
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
  ApiProperty,
} from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { IsNotEmpty, IsInt, IsString } from 'class-validator';

// ✅ DTO for promotion request
class PromoteEnrollmentDto {
  @ApiProperty({
    description: 'New class ID for promotion',
    example: 6,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  newClassId: number;

  @ApiProperty({
    description: 'New section ID for promotion',
    example: 2,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  newSectionId: number;

  @ApiProperty({
    description: 'Academic year for new enrollment',
    example: '2082-2083',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  academicYear: string;
}

@ApiTags('Enrollment Management')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create enrollment',
    description:
      'Enroll a student in a class and section for an academic year.',
  })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateEnrollmentDto,
    @GetUser('userId') userId: number,
  ) {
    return this.enrollmentService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all enrollments',
    description:
      'Retrieve enrollments optionally filtered by student and academic year.',
  })
  @ApiQuery({
    name: 'studentId',
    description: 'Student ID (optional filter)',
    example: 123,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year (optional filter)',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of enrollments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query('studentId', new ParseIntPipe({ optional: true }))
    studentId?: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.enrollmentService.findAll(schoolId, studentId, academicYear);
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Get enrollments by student',
    description: 'Retrieve all enrollments for a specific student.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student enrollments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.enrollmentService.findByStudent(studentId, schoolId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get enrollment by ID',
    description: 'Retrieve detailed information about a specific enrollment.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.enrollmentService.findOne(id, schoolId);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get enrollment with full details',
    description:
      'Retrieve enrollment with student, class, and section details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Complete enrollment details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  getDetails(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.enrollmentService.getCurrentEnrollmentWithDetails(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update enrollment',
    description: 'Update enrollment information such as status or roll number.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateEnrollmentDto })
  @ApiResponse({
    status: 200,
    description: 'Enrollment updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateEnrollmentDto,
    @GetUser('userId') userId: number,
  ) {
    return this.enrollmentService.update(id, schoolId, updateDto, userId);
  }

  @Patch(':id/promote')
  @ApiOperation({
    summary: 'Promote student',
    description: 'Promote a student to the next class/grade level.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: PromoteEnrollmentDto })
  @ApiResponse({
    status: 200,
    description: 'Student promoted successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid promotion data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async promote(
    @Param('id', ParseIntPipe) enrollmentId: number,
    @GetUser('schoolId') schoolId: number,
    @Body() promoteDto: PromoteEnrollmentDto,
    @GetUser('userId') userId: number,
  ) {
    // ✅ Validate required fields
    if (!promoteDto.newClassId) {
      throw new BadRequestException('newClassId is required');
    }
    if (!promoteDto.newSectionId) {
      throw new BadRequestException('newSectionId is required');
    }
    if (!promoteDto.academicYear) {
      throw new BadRequestException('academicYear is required');
    }

    // Resolve the student from the enrollment: the service promotes by
    // studentId, while this route is addressed by enrollmentId.
    const enrollment = await this.enrollmentService.findOne(
      enrollmentId,
      schoolId,
    );

    return this.enrollmentService.promoteStudent(
      enrollment.student_id,
      schoolId,
      promoteDto.newClassId,
      promoteDto.academicYear,
      promoteDto.newSectionId,
      userId,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete enrollment',
    description: 'Remove an enrollment record from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Enrollment ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Enrollment deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.enrollmentService.remove(id, schoolId);
  }
}
