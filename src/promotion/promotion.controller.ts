import {
  Controller,
  Get,
  Post,
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
import { PromotionService } from './promotion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Promotion')
@ApiBearerAuth()
@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('promote')
  @ApiOperation({
    summary: 'Promote Students to Next Class',
    description: `Promote students from current class to next class.

**Features:**
- Bulk promotion by class
- Option to promote all or selected students
- Automatic roll number reset
- Academic year update
- Fee structure migration`,
  })
  @ApiBody({
    description: 'Promotion data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        fromClassId: { type: 'number', example: 10 },
        toClassId: { type: 'number', example: 11 },
        academicYear: { type: 'string', example: '2081-2082' },
        studentIds: {
          type: 'array',
          items: { type: 'number', example: 123 },
          description: 'Optional: specific students',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Students promoted',
    schema: {
      type: 'object',
      properties: {
        promotedCount: { type: 'number', example: 45 },
        message: { type: 'string', example: 'Students promoted successfully' },
      },
    },
  })
  promoteClass(@Body() dto: any) {
    return this.promotionService.promoteClass(dto.schoolId, dto);
  }

  @Post('demote')
  @ApiOperation({
    summary: 'Demote/Repeat Students',
    description: `Demote students to repeat the same class.

**Note:** Use with caution - students will stay in same class for next academic year.`,
  })
  @ApiBody({
    description: 'Demotion data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        academicYear: { type: 'string', example: '2081-2082' },
        studentIds: { type: 'array', items: { type: 'number', example: 123 } },
        reason: { type: 'string', example: 'Academic performance' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Students demoted',
    schema: {
      type: 'object',
      properties: {
        demotedCount: { type: 'number', example: 5 },
        message: { type: 'string', example: 'Students demoted successfully' },
      },
    },
  })
  demoteClass(@Body() dto: any) {
    return this.promotionService.demoteClass(dto.schoolId, dto);
  }

  @Get('report')
  @ApiOperation({
    summary: 'Get Promotion Report',
    description: `Get promotion report for an academic year.

**Returns:**
- Total students
- Promoted count
- Demoted count
- Left (transferred out) count
- Statistics by class`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion report',
    schema: {
      type: 'object',
      properties: {
        academicYear: { type: 'string', example: '2081-2082' },
        totalStudents: { type: 'number', example: 500 },
        promoted: { type: 'number', example: 450 },
        demoted: { type: 'number', example: 10 },
        left: { type: 'number', example: 40 },
        byClass: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  getPromotionReport(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.promotionService.getPromotionReport(schoolId, academicYear);
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Get Student Promotion History',
    description: `Get all promotion/demotion records for a student.`,
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
    description: 'Promotion history',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          type: { type: 'string', example: 'PROMOTION' },
          fromClass: { type: 'string', example: 'Grade 10' },
          toClass: { type: 'string', example: 'Grade 11' },
          academicYear: { type: 'string', example: '2081-2082' },
          promotedAt: { type: 'string', example: '2082-04-15' },
        },
      },
    },
  })
  getPromotionHistory(
    @Param('studentId') studentId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.promotionService.getPromotionHistory(studentId, schoolId);
  }
}
