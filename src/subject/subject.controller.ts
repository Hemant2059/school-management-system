import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { GetSubjectsDto } from './dto/get-subjects.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@ApiTags('Subject Management')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiOperation({
    summary: 'Create subject',
    description: 'Create a new subject in the system.',
  })
  @ApiBody({ type: CreateSubjectDto })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateSubjectDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.subjectService.create({ ...createDto, schoolId });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all subjects',
    description: 'Retrieve list of all subjects with optional filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subjects retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query() getSubjectsDto: GetSubjectsDto,
  ) {
    return this.subjectService.findAll(schoolId, getSubjectsDto);
  }

  @Get('group/:group')
  @ApiOperation({
    summary: 'Get subjects by group',
    description: 'Retrieve subjects filtered by group/faculty.',
  })
  @ApiParam({
    name: 'group',
    description: 'Subject group',
    example: 'SCIENCE',
    enum: ['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'],
  })
  @ApiResponse({
    status: 200,
    description: 'Subjects retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByGroup(
    @Param('group') group: string,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.subjectService.getSubjectsByGroup(schoolId, group);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get subject by ID',
    description: 'Retrieve detailed information about a specific subject.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Subject details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.subjectService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update subject',
    description: 'Update subject information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateSubjectDto })
  @ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete subject',
    description: 'Remove a subject from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Subject deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.subjectService.remove(id, schoolId);
  }
}
