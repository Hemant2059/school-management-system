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
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StudentGuardianService } from './student-guardian.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Student Guardian')
@ApiBearerAuth()
@Controller('student-guardian')
@UseGuards(JwtAuthGuard)
export class StudentGuardianController {
  constructor(
    private readonly studentGuardianService: StudentGuardianService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Link Guardian to Student',
    description: `Create a relationship between a student and guardian.

**Features:**
- Set relation type (Father, Mother, Guardian)
- Mark as primary guardian
- Get notifications priority`,
  })
  @ApiBody({
    description: 'Link data',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        guardianId: { type: 'number', example: 1 },
        relation: {
          type: 'string',
          example: 'FATHER',
          enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
        },
        isPrimary: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Guardian linked successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        guardianId: { type: 'number', example: 1 },
        relation: { type: 'string', example: 'FATHER' },
        message: { type: 'string', example: 'Guardian linked successfully' },
      },
    },
  })
  linkGuardian(@Body() createDto: any) {
    return this.studentGuardianService.linkGuardian(createDto);
  }

  @Delete(':studentId/:guardianId')
  @ApiOperation({
    summary: 'Unlink Guardian from Student',
    description: `Remove relationship between a student and guardian.

**Note:** Cannot unlink if only guardian link exists.`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiParam({
    name: 'guardianId',
    description: 'Guardian ID',
    example: 1,
    type: Number,
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
    description: 'Guardian unlinked',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Guardian unlinked successfully' },
      },
    },
  })
  unlinkGuardian(
    @Param('studentId') studentId: number,
    @Param('guardianId') guardianId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.studentGuardianService.unlinkGuardian(
      studentId,
      guardianId,
      schoolId,
    );
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Get Guardians for Student',
    description: `Get all guardians linked to a student.`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
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
    description: 'List of guardians',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          firstName: { type: 'string', example: 'Shyam' },
          lastName: { type: 'string', example: 'Sharma' },
          mobile: { type: 'string', example: '9841234567' },
          relation: { type: 'string', example: 'FATHER' },
          isPrimary: { type: 'boolean', example: true },
        },
      },
    },
  })
  findGuardiansByStudent(
    @Param('studentId') studentId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.studentGuardianService.findGuardiansByStudent(
      studentId,
      schoolId,
    );
  }

  @Get('guardian/:guardianId')
  @ApiOperation({
    summary: 'Get Students for Guardian',
    description: `Get all students linked to a guardian.`,
  })
  @ApiParam({
    name: 'guardianId',
    description: 'Guardian ID',
    example: 1,
    type: Number,
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
    description: 'List of students',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 123 },
          firstName: { type: 'string', example: 'Ram' },
          lastName: { type: 'string', example: 'Sharma' },
          class: { type: 'string', example: 'Grade 10' },
          relation: { type: 'string', example: 'FATHER' },
          isPrimary: { type: 'boolean', example: true },
        },
      },
    },
  })
  findStudentsByGuardian(
    @Param('guardianId') guardianId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.studentGuardianService.findStudentsByGuardian(
      guardianId,
      schoolId,
    );
  }

  @Get('student/:studentId/primary')
  @ApiOperation({
    summary: 'Get Primary Guardian',
    description: `Get primary guardian for a student (for notifications).`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
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
    description: 'Primary guardian',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstName: { type: 'string', example: 'Shyam' },
        lastName: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'guardian@email.com' },
      },
    },
  })
  getPrimaryGuardian(
    @Param('studentId') studentId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.studentGuardianService.getPrimaryGuardian(studentId, schoolId);
  }

  @Put(':studentId/:guardianId')
  @ApiOperation({
    summary: 'Update Guardian Link',
    description: `Update relationship between student and guardian.

**Can update:**
- Relation type
- Primary status`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiParam({
    name: 'guardianId',
    description: 'Guardian ID',
    example: 1,
    type: Number,
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
    description: 'Guardian link updated',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Guardian link updated successfully',
        },
      },
    },
  })
  updateGuardianLink(
    @Param('studentId') studentId: number,
    @Param('guardianId') guardianId: number,
    @Query('schoolId') schoolId: number,
    @Body() updateDto: any,
  ) {
    return this.studentGuardianService.updateGuardianLink(
      studentId,
      guardianId,
      schoolId,
      updateDto,
    );
  }
}
