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
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@ApiTags('Assignment Management')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create assignment',
    description: 'Create a new assignment for students.',
  })
  @ApiBody({ type: CreateAssignmentDto })
  @ApiResponse({
    status: 201,
    description: 'Assignment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateAssignmentDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.assignmentService.create({ ...createDto, schoolId });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all assignments',
    description:
      'Retrieve assignments optionally filtered by class, section, and subject.',
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'subjectId',
    description: 'Subject ID (optional filter)',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of assignments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('subjectId', new ParseIntPipe({ optional: true }))
    subjectId?: number,
  ) {
    return this.assignmentService.findAll(schoolId, classId, subjectId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get assignment by ID',
    description: 'Retrieve detailed information about a specific assignment.',
  })
  @ApiParam({
    name: 'id',
    description: 'Assignment ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.assignmentService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update assignment',
    description:
      'Update assignment information such as description or due date.',
  })
  @ApiParam({
    name: 'id',
    description: 'Assignment ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateAssignmentDto })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateAssignmentDto,
  ) {
    return this.assignmentService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete assignment',
    description: 'Remove an assignment from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Assignment ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.assignmentService.remove(id, schoolId);
  }
}
