import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { HrService } from './hr.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@ApiTags('HR & Payroll Management')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Staff Management
  @Post('staff')
  @ApiOperation({
    summary: 'Add new staff member',
    description: 'Register a new staff member (non-teaching) in the system.',
  })
  @ApiBody({ type: CreateStaffDto })
  @ApiResponse({
    status: 201,
    description: 'Staff member added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createStaff(@Body() createDto: CreateStaffDto) {
    return this.hrService.createStaff(createDto);
  }

  @Get('staff')
  @ApiOperation({
    summary: 'Get all staff members',
    description: 'Retrieve list of all staff members.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of staff retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllStaff(@GetUser('schoolId') schoolId: number) {
    return this.hrService.findAllStaff(schoolId);
  }

  @Get('staff/:id')
  @ApiOperation({
    summary: 'Get staff member by ID',
    description: 'Retrieve detailed information about a specific staff member.',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Staff details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  findOneStaff(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.hrService.findOneStaff(id, schoolId);
  }

  // Payroll
  @Post('payroll/process')
  @ApiOperation({
    summary: 'Process payroll',
    description: 'Process monthly payroll for staff members.',
  })
  @ApiBody({ type: ProcessPayrollDto })
  @ApiResponse({
    status: 201,
    description: 'Payroll processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  processPayroll(@Body() processDto: ProcessPayrollDto) {
    return this.hrService.processPayroll(processDto);
  }

  @Get('payroll/staff/:staffId')
  @ApiOperation({
    summary: 'Get staff payroll history',
    description: 'Retrieve payroll history for a specific staff member.',
  })
  @ApiParam({
    name: 'staffId',
    description: 'Staff ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'year',
    description: 'Filter by year (optional)',
    example: '2024',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Staff payroll history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  getStaffPayroll(
    @Param('staffId', ParseIntPipe) staffId: number,
    @GetUser('schoolId') schoolId: number,
    @Query('year') year?: string,
  ) {
    return this.hrService.getStaffPayroll(staffId, schoolId, year);
  }

  @Get('payroll/:payrollId/payslip')
  @ApiOperation({
    summary: 'Generate payslip',
    description: 'Generate PDF payslip for a specific payroll record.',
  })
  @ApiParam({
    name: 'payrollId',
    description: 'Payroll ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Payslip generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payroll record not found' })
  generatePayslip(@Param('payrollId', ParseIntPipe) payrollId: number) {
    return this.hrService.generatePayslip(payrollId);
  }

  // Leave Management
  @Post('leaves')
  @ApiOperation({
    summary: 'Create leave request',
    description: 'Submit a leave request for approval.',
  })
  @ApiBody({ type: CreateLeaveRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Leave request created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createLeaveRequest(@Body() createDto: CreateLeaveRequestDto) {
    return this.hrService.createLeaveRequest(createDto);
  }

  // Leave Types (admin-managed)
  @Post('leave-types')
  @ApiOperation({
    summary: 'Create leave type',
    description:
      'Create a school-level leave type. Name stored in English + Nepali as sent by frontend.',
  })
  @ApiBody({ type: CreateLeaveTypeDto })
  @ApiResponse({ status: 201, description: 'Leave type created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createLeaveType(@Body() createDto: CreateLeaveTypeDto) {
    return this.hrService.createLeaveType(createDto);
  }

  @Get('leave-types')
  @ApiOperation({
    summary: 'Get leave types',
    description: 'Retrieve all active leave types for the school.',
  })
  @ApiQuery({ name: 'schoolId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Leave types retrieved successfully' })
  getLeaveTypes(@Query('schoolId') schoolId: number) {
    return this.hrService.getLeaveTypes(schoolId);
  }

  @Patch('leave-types/:id')
  @ApiOperation({ summary: 'Update leave type' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateLeaveTypeDto })
  @ApiResponse({ status: 200, description: 'Leave type updated successfully' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  updateLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Query('schoolId') schoolId: number,
    @Body() updateDto: UpdateLeaveTypeDto,
  ) {
    return this.hrService.updateLeaveType(id, schoolId, updateDto);
  }

  @Delete('leave-types/:id')
  @ApiOperation({
    summary: 'Delete leave type',
    description:
      'Soft-deletes (deactivates) the leave type. Blocked while pending requests reference it.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'schoolId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Leave type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async deleteLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Query('schoolId') schoolId: number,
  ) {
    await this.hrService.deleteLeaveType(id, schoolId);
    return { message: 'Leave type deleted successfully' };
  }

  @Patch('leaves/:leaveRequestId/approve')
  @ApiOperation({
    summary: 'Approve leave request',
    description: 'Approve a pending leave request.',
  })
  @ApiParam({
    name: 'leaveRequestId',
    description: 'Leave Request ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approvedBy: {
          type: 'number',
          description: 'User ID of approver',
          example: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Leave request approved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  approveLeaveRequest(
    @Param('leaveRequestId', ParseIntPipe) leaveRequestId: number,
    @Body('approvedBy') approvedBy: number,
  ) {
    return this.hrService.approveLeaveRequest(leaveRequestId, approvedBy);
  }

  @Patch('leaves/:leaveRequestId/reject')
  @ApiOperation({
    summary: 'Reject leave request',
    description: 'Reject a pending leave request with reason.',
  })
  @ApiParam({
    name: 'leaveRequestId',
    description: 'Leave Request ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rejectionReason: {
          type: 'string',
          description: 'Reason for rejection',
          example: 'Insufficient coverage available',
        },
        rejectionReasonNp: {
          type: 'string',
          description: 'Reason for rejection in Nepali (provided by frontend)',
          example: 'पर्याप्त कभरेज उपलब्ध छैन',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Leave request rejected successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  rejectLeaveRequest(
    @Param('leaveRequestId', ParseIntPipe) leaveRequestId: number,
    @Body('rejectionReason') rejectionReason: string,
    @Body('rejectionReasonNp') rejectionReasonNp?: string,
  ) {
    return this.hrService.rejectLeaveRequest(
      leaveRequestId,
      rejectionReason,
      rejectionReasonNp,
    );
  }

  // Nepal Holidays
  @Get('holidays/:year')
  @ApiOperation({
    summary: 'Get Nepal public holidays',
    description: 'Retrieve list of Nepal public holidays for a specific year.',
  })
  @ApiParam({
    name: 'year',
    description: 'Year (AD)',
    example: 2024,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Holidays retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getNepalHolidays(@Param('year', ParseIntPipe) year: number) {
    return this.hrService.getNepalHolidays(year);
  }
}
