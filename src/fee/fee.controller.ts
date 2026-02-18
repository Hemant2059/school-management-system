import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
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
import { FeeService } from './fee.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Fee Management')
@ApiBearerAuth()
@Controller('fee')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // Fee Categories
  @Post('categories')
  @ApiOperation({
    summary: 'Create fee category',
    description: 'Create a new fee category (e.g., Tuition, Library, Sports).',
  })
  @ApiBody({ type: CreateFeeCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Fee category created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createCategory(@Body() createDto: CreateFeeCategoryDto) {
    return this.feeService.createFeeCategory(createDto);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get all fee categories',
    description: 'Retrieve list of all fee categories.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fee categories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllCategories(@GetUser('schoolId') schoolId: number) {
    return this.feeService.findAllFeeCategories(schoolId);
  }

  // Fee Structures
  @Post('structures')
  @ApiOperation({
    summary: 'Create fee structure',
    description: 'Define fee structure for a class/section.',
  })
  @ApiBody({ type: CreateFeeStructureDto })
  @ApiResponse({
    status: 201,
    description: 'Fee structure created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createStructure(@Body() createDto: CreateFeeStructureDto) {
    return this.feeService.createFeeStructure(createDto);
  }

  @Get('structures/class/:classId')
  @ApiOperation({
    summary: 'Get fee structure for class',
    description: 'Get fee structure for specific class and section.',
  })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID (optional)',
    example: 2,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'academicYearId',
    description: 'Academic year ID (optional)',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Fee structure retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStructureForClass(
    @Param('classId', ParseIntPipe) classId: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
    @Query('sectionId', ParseIntPipe) sectionId?: number,
    @Query('academicYearId', ParseIntPipe) academicYearId?: number,
  ) {
    return this.feeService.getFeeStructureForClass(
      schoolId,
      classId,
      sectionId,
      academicYearId,
    );
  }

  // Student Fees
  @Post('student-fees')
  @ApiOperation({
    summary: 'Assign fee to student',
    description: 'Assign a fee structure to a specific student.',
  })
  @ApiBody({ type: CreateStudentFeeDto })
  @ApiResponse({
    status: 201,
    description: 'Student fee assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createStudentFee(@Body() createDto: CreateStudentFeeDto) {
    return this.feeService.createStudentFee(createDto);
  }

  @Get('student-fees/student/:studentId')
  @ApiOperation({
    summary: 'Get student fees',
    description: 'Retrieve all fees for a specific student.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiQuery({
    name: 'academicYearId',
    description: 'Academic year ID (optional)',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Student fees retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentFees(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('academicYearId', ParseIntPipe) academicYearId?: number,
  ) {
    return this.feeService.getStudentFees(studentId, academicYearId);
  }

  // Payments
  @Post('payments')
  @ApiOperation({
    summary: 'Process fee payment',
    description: 'Record a fee payment made by a student.',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  processPayment(
    @Body() createDto: CreatePaymentDto,
    @GetUser('userId') userId: number,
  ) {
    return this.feeService.processPayment(createDto, userId);
  }

  @Get('receipts/:transactionId')
  @ApiOperation({
    summary: 'Get payment receipt',
    description: 'Generate payment receipt for a specific transaction.',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment receipt generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  generateReceipt(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.feeService.generateReceipt(transactionId);
  }

  // Overdue Fees
  @Get('reminders/overdue')
  @ApiOperation({
    summary: 'Get overdue fees',
    description: 'Retrieve list of students with overdue fees.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'daysOverdue',
    description: 'Days overdue threshold (optional)',
    example: 30,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue fees retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getOverdueFees(
    @GetUser('schoolId') schoolId: number,
    @Query('daysOverdue', ParseIntPipe) daysOverdue?: number,
  ) {
    return this.feeService.getOverdueFees(schoolId, daysOverdue);
  }
}
