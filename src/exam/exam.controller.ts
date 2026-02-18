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
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@ApiTags('Exam Management')
@ApiBearerAuth()
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiOperation({
    summary: 'Create exam',
    description: 'Create a new examination for a specific class and subject.',
  })
  @ApiBody({ type: CreateExamDto })
  @ApiResponse({
    status: 201,
    description: 'Exam created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(@Body() createDto: CreateExamDto) {
    return this.examService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all exams',
    description: 'Retrieve exams optionally filtered by class and exam type.',
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
  @ApiResponse({
    status: 200,
    description: 'List of exams retrieved successfully',
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
  @ApiOperation({
    summary: 'Get exam by ID',
    description: 'Retrieve detailed information about a specific exam.',
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
  @ApiOperation({
    summary: 'Update exam',
    description: 'Update exam information such as date, time, or marks.',
  })
  @ApiParam({
    name: 'id',
    description: 'Exam ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateExamDto })
  @ApiResponse({
    status: 200,
    description: 'Exam updated successfully',
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
  @ApiOperation({
    summary: 'Delete exam',
    description: 'Remove an exam from the system.',
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
