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
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@ApiTags('Timetable Management')
@ApiBearerAuth()
@Controller('timetables')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  @ApiOperation({
    summary: 'Create timetable entry',
    description: 'Create a new timetable period entry for a class.',
  })
  @ApiBody({ type: CreateTimetableDto })
  @ApiResponse({
    status: 201,
    description: 'Timetable entry created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(@Body() createDto: CreateTimetableDto) {
    return this.timetableService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all timetable entries',
    description:
      'Retrieve timetable entries for a specific class and optional section.',
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID (optional)',
    example: 2,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Timetable entries retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('sectionId', new ParseIntPipe({ optional: true }))
    sectionId?: number,
  ) {
    return this.timetableService.findAll(schoolId, classId, sectionId);
  }

  @Get('weekly')
  @ApiOperation({
    summary: 'Get weekly timetable',
    description:
      'Retrieve complete weekly schedule organized by days for a class/section.',
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID (optional)',
    example: 2,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly timetable retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getWeeklyTimetable(
    @GetUser('schoolId') schoolId: number,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('sectionId', new ParseIntPipe({ optional: true }))
    sectionId?: number,
  ) {
    return this.timetableService.getWeeklyTimetable(
      schoolId,
      classId,
      sectionId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get timetable entry by ID',
    description:
      'Retrieve detailed information about a specific timetable period.',
  })
  @ApiParam({
    name: 'id',
    description: 'Timetable entry ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Timetable entry details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timetable entry not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.timetableService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update timetable entry',
    description: 'Update timetable information such as time, teacher, or room.',
  })
  @ApiParam({
    name: 'id',
    description: 'Timetable entry ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateTimetableDto })
  @ApiResponse({
    status: 200,
    description: 'Timetable entry updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timetable entry not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateTimetableDto,
  ) {
    return this.timetableService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete timetable entry',
    description: 'Remove a timetable period from the schedule.',
  })
  @ApiParam({
    name: 'id',
    description: 'Timetable entry ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Timetable entry deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Timetable entry not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.timetableService.remove(id, schoolId);
  }
}
