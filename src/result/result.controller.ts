import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ResultService } from './result.service';
import { CalculateMarksDto } from './dto/calculate-marks.dto';

@ApiTags('Result Management')
@ApiBearerAuth()
@Controller('results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate and save marks',
    description: 'Calculate student marks including grades and GPA.',
  })
  @ApiBody({ type: CalculateMarksDto })
  @ApiResponse({
    status: 201,
    description: 'Marks calculated and saved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  calculateMarks(
    @Body() calculateDto: CalculateMarksDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.resultService.calculateAndSaveMarks(
      calculateDto.examId,
      calculateDto.studentId,
      schoolId,
      calculateDto.theoryMarks,
      calculateDto.practicalMarks,
      calculateDto.fullMarks,
    );
  }

  @Get('report-card/:studentId/:academicYear')
  @ApiOperation({
    summary: 'Generate report card',
    description: 'Generate comprehensive report card for a student.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiParam({
    name: 'academicYear',
    description: 'Academic year in BS format',
    example: '2081-2082',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Report card generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student or results not found' })
  generateReportCard(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
    @Param('academicYear') academicYear: string,
  ) {
    return this.resultService.generateReportCard(
      studentId,
      schoolId,
      academicYear,
    );
  }

  @Get('student/:studentId')
  @ApiOperation({
    summary: 'Get student results',
    description: 'Retrieve all exam results for a specific student.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student results retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentResults(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.resultService.getStudentResults(studentId, schoolId);
  }
}
