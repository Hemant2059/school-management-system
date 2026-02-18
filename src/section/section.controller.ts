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
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@ApiTags('Section Management')
@ApiBearerAuth()
@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create section',
    description: 'Create a new section within a class.',
  })
  @ApiBody({ type: CreateSectionDto })
  @ApiResponse({
    status: 201,
    description: 'Section created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateSectionDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.sectionService.create({ ...createDto, schoolId });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all sections',
    description: 'Retrieve sections optionally filtered by school and class.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID (optional filter)',
    example: 5,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of sections retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query('classId', new ParseIntPipe({ optional: true })) classId?: number,
  ) {
    return this.sectionService.findAll(schoolId, classId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get section by ID',
    description: 'Retrieve detailed information about a specific section.',
  })
  @ApiParam({
    name: 'id',
    description: 'Section ID',
    example: 2,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Section details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.sectionService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update section',
    description: 'Update section information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Section ID',
    example: 2,
    type: Number,
  })
  @ApiBody({ type: UpdateSectionDto })
  @ApiResponse({
    status: 200,
    description: 'Section updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateSectionDto,
  ) {
    return this.sectionService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete section',
    description: 'Remove a section from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Section ID',
    example: 2,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Section deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.sectionService.remove(id, schoolId);
  }
}
