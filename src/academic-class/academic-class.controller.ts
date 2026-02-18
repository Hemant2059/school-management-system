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
import { AcademicClassService } from './academic-class.service';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';

@ApiTags('Academic Class Management')
@ApiBearerAuth()
@Controller('classes')
export class AcademicClassController {
  constructor(private readonly academicClassService: AcademicClassService) {}

  @Post()
  @ApiOperation({
    summary: 'Create academic class',
    description: 'Create a new academic class/grade level in the system.',
  })
  @ApiBody({ type: CreateAcademicClassDto })
  @ApiResponse({
    status: 201,
    description: 'Class created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateAcademicClassDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.academicClassService.create({ ...createDto, schoolId });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all classes',
    description: 'Retrieve all academic classes for a specific school.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of classes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser('schoolId') schoolId: number) {
    return this.academicClassService.findAll(schoolId);
  }

  @Get('level')
  @ApiOperation({
    summary: 'Get classes by education level',
    description: 'Retrieve classes filtered by education level.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'level',
    description: 'Education level',
    example: 'PRIMARY',
    enum: ['PRIMARY', 'LOWER_SECONDARY', 'SECONDARY', 'HIGHER_SECONDARY'],
  })
  @ApiResponse({
    status: 200,
    description: 'Classes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByLevel(
    @GetUser('schoolId') schoolId: number,
    @Query('level') level: string,
  ) {
    return this.academicClassService.getClassesByLevel(schoolId, level);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get class by ID',
    description: 'Retrieve detailed information about a specific class.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Class details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.academicClassService.findOne(id, schoolId);
  }

  @Get('code/:classCode')
  @ApiOperation({
    summary: 'Get class by code',
    description: 'Lookup class using school ID and class code.',
  })
  @ApiParam({
    name: 'classCode',
    description: 'Class code',
    example: 'G5',
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
    description: 'Class found successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findByCode(
    @GetUser('schoolId') schoolId: number,
    @Param('classCode') classCode: string,
  ) {
    return this.academicClassService.findBySchoolAndCode(schoolId, classCode);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update class',
    description: 'Update academic class information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @ApiBody({ type: UpdateAcademicClassDto })
  @ApiResponse({
    status: 200,
    description: 'Class updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateAcademicClassDto,
  ) {
    return this.academicClassService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete class',
    description: 'Remove an academic class from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Class deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.academicClassService.remove(id, schoolId);
  }
}
