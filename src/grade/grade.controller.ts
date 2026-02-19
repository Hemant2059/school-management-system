import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { GradeService } from './grade.service';
import {
  CreateGradeScaleDto,
  UpdateGradeScaleDto,
} from './dto/grade-scale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Grade Scales')
@Controller('grade-scales')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_CREATE)
  @ApiOperation({
    summary: 'Create Grade Scale',
    description: `Create a new grade scale for evaluation.

**Features:**
- Define grade letter (A, B, C, etc.)
- Set marks range (min and max)
- Set grade point
- Configure pass/fail status
- School-specific configuration

**Note:** Grade scales are used for converting marks to grades in results.`,
  })
  @ApiBody({
    description: 'Grade scale creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        gradeName: { type: 'string', example: 'A+' },
        minMarks: { type: 'number', example: 90 },
        maxMarks: { type: 'number', example: 100 },
        gradePoint: { type: 'number', example: 4.0 },
        description: { type: 'string', example: 'Excellent' },
        isPass: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Grade scale created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        gradeName: { type: 'string', example: 'A+' },
        message: {
          type: 'string',
          example: 'Grade scale created successfully',
        },
      },
    },
  })
  create(@Body() createDto: CreateGradeScaleDto) {
    return this.gradeService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get All Grade Scales',
    description: `Retrieve all grade scales for a school.

**Query Parameters:**
- schoolId: Required for filtering

**Returns:**
- Grade letter with marks range
- Grade points
- Pass/fail status`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'List of grade scales',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          gradeName: { type: 'string', example: 'A+' },
          minMarks: { type: 'number', example: 90 },
          maxMarks: { type: 'number', example: 100 },
          gradePoint: { type: 'number', example: 4.0 },
          isPass: { type: 'boolean', example: true },
        },
      },
    },
  })
  findAll(@Query('schoolId') schoolId: number) {
    return this.gradeService.findAll(schoolId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Grade Scale by ID',
    description: `Retrieve grade scale details by ID.

**Returns:**
- Grade letter with marks range
- Grade points
- Pass/fail status
- School information`,
  })
  @ApiResponse({
    status: 200,
    description: 'Grade scale details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        gradeName: { type: 'string', example: 'A+' },
        minMarks: { type: 'number', example: 90 },
        maxMarks: { type: 'number', example: 100 },
        gradePoint: { type: 'number', example: 4.0 },
        description: { type: 'string', example: 'Excellent' },
        isPass: { type: 'boolean', example: true },
      },
    },
  })
  findOne(@Param('id') id: number, @Query('schoolId') schoolId: number) {
    return this.gradeService.findOne(id, schoolId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_UPDATE)
  @ApiOperation({
    summary: 'Update Grade Scale',
    description: `Update a grade scale.

**Note:** Changes to grade scales will affect existing results if recalculated.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Grade scale updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        message: {
          type: 'string',
          example: 'Grade scale updated successfully',
        },
      },
    },
  })
  update(
    @Param('id') id: number,
    @Query('schoolId') schoolId: number,
    @Body() updateDto: UpdateGradeScaleDto,
  ) {
    return this.gradeService.update(id, schoolId, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_UPDATE)
  @ApiOperation({
    summary: 'Delete Grade Scale',
    description: `Soft delete a grade scale (marks as inactive).

**Note:** Cannot delete if used in active grade scales.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Grade scale deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Grade scale deleted successfully',
        },
      },
    },
  })
  remove(@Param('id') id: number, @Query('schoolId') schoolId: number) {
    return this.gradeService.remove(id, schoolId);
  }

  @Post('default')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_CREATE)
  @ApiOperation({
    summary: 'Get or Create Default Grade Scales',
    description: `Get existing or create default grade scales for a school.

**Default Scale:**
- A+ (90-100): 4.0
- A (80-89): 3.6
- B+ (70-79): 3.2
- B (60-69): 2.8
- C+ (50-59): 2.4
- C (40-49): 2.0
- D (30-39): 1.6
- E (0-29): 0.0

**Note:** Only creates if no grade scales exist for the school.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Default grade scales created',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          gradeName: { type: 'string', example: 'A+' },
          minMarks: { type: 'number', example: 90 },
          maxMarks: { type: 'number', example: 100 },
          gradePoint: { type: 'number', example: 4.0 },
        },
      },
    },
  })
  getOrCreateDefault(@Query('schoolId') schoolId: number) {
    return this.gradeService.getOrCreateDefaultGradeScales(schoolId);
  }
}
