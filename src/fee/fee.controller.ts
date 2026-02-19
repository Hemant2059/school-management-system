import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
  UseGuards,
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
  ApiExtraModels,
} from '@nestjs/swagger';
import { FeeService } from './fee.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Fee Management')
@ApiBearerAuth()
@Controller('fee')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // Fee Categories
  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Create Fee Category',
    description: `Create a new fee category for the school.

**Features:**
- Define category name (Tuition, Library, Sports, Transport, Hostel, etc.)
- Set category type (one-time, monthly, quarterly, yearly)
- Configure if refundable
- Set description

**Note:** Categories are school-specific.`,
  })
  @ApiBody({
    description: 'Fee category creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Tuition Fee' },
        description: { type: 'string', example: 'Monthly tuition fee' },
        categoryType: {
          type: 'string',
          example: 'MONTHLY',
          enum: ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
        },
        isRefundable: { type: 'boolean', example: false },
        isOptional: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fee category created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Tuition Fee' },
        categoryType: { type: 'string', example: 'MONTHLY' },
        message: {
          type: 'string',
          example: 'Fee category created successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createCategory(@Body() createDto: CreateFeeCategoryDto) {
    return this.feeService.createFeeCategory(createDto);
  }

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get All Fee Categories',
    description: `Retrieve list of all fee categories for a school.

**Returns:**
- Category name and type
- Whether refundable or optional
- Active status`,
  })
  @ApiResponse({
    status: 200,
    description: 'Fee categories retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Tuition Fee' },
          description: { type: 'string', example: 'Monthly tuition fee' },
          categoryType: { type: 'string', example: 'MONTHLY' },
          isRefundable: { type: 'boolean', example: false },
          isOptional: { type: 'boolean', example: false },
          isActive: { type: 'boolean', example: true },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllCategories(@GetUser('schoolId') schoolId: number) {
    return this.feeService.findAllFeeCategories(schoolId);
  }

  // Fee Structures
  @Post('structures')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Create Fee Structure',
    description: `Define fee structure for a class/section.

**Features:**
- Link fee categories to a class
- Set amounts for each category
- Define due dates
- Configure late fees
- Academic year specific

**Note:** Can create structure for entire class or specific section.`,
  })
  @ApiBody({
    description: 'Fee structure creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        sectionId: { type: 'number', example: 1 },
        academicYear: { type: 'string', example: '2081-2082' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'number', example: 1 },
              amount: { type: 'number', example: 5000 },
              dueDate: { type: 'string', example: '2081-04-15' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fee structure created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        message: {
          type: 'string',
          example: 'Fee structure created successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createStructure(@Body() createDto: CreateFeeStructureDto) {
    return this.feeService.createFeeStructure(createDto);
  }

  @Get('structures/class/:classId')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Fee Structure for Class',
    description: `Get fee structure for specific class and section.

**Query Parameters:**
- schoolId: Required for filtering
- sectionId: Optional - specific section
- academicYearId: Optional - specific academic year

**Returns:**
- All fee categories with amounts
- Due dates for each category
- Late fee configuration`,
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
    required: true,
  })
  @ApiQuery({
    name: 'sectionId',
    description: 'Section ID (optional)',
    example: 2,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year (optional)',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Fee structure retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        classId: { type: 'number', example: 10 },
        className: { type: 'string', example: 'Grade 10' },
        academicYear: { type: 'string', example: '2081-2082' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'number', example: 1 },
              categoryName: { type: 'string', example: 'Tuition Fee' },
              amount: { type: 'number', example: 5000 },
              dueDate: { type: 'string', example: '2081-04-15' },
              lateFee: { type: 'number', example: 100 },
            },
          },
        },
        totalAmount: { type: 'number', example: 5000 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStructureForClass(
    @Param('classId', ParseIntPipe) classId: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
    @Query('sectionId', ParseIntPipe) sectionId?: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.feeService.getFeeStructureForClass(
      schoolId,
      classId,
      sectionId,
      academicYear,
    );
  }

  // Student Fees
  @Post('student-fees')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Assign Fee to Student',
    description: `Assign a fee structure to a specific student.

**Features:**
- Can assign individual fee structure
- Override specific amounts if needed
- Set custom due dates
- Support for siblings discount

**Note:** This is for individual student fee assignment. Use fee structures for bulk class assignment.`,
  })
  @ApiBody({
    description: 'Student fee assignment data',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        schoolId: { type: 'number', example: 1 },
        academicYear: { type: 'string', example: '2081-2082' },
        feeStructureId: { type: 'number', example: 1 },
        categoryAmounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'number', example: 1 },
              amount: { type: 'number', example: 5000 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Student fee assigned successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        totalAmount: { type: 'number', example: 5000 },
        message: {
          type: 'string',
          example: 'Student fee assigned successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createStudentFee(@Body() createDto: CreateStudentFeeDto) {
    return this.feeService.createStudentFee(createDto);
  }

  @Get('student-fees/student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Student Fees',
    description: `Retrieve all fees for a specific student.

**Query Parameters:**
- academicYear: Optional filter by academic year

**Returns:**
- All fee categories with amounts
- Payment status for each category
- Due dates
- Payment history`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year (optional)',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Student fees retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        studentName: { type: 'string', example: 'Ram Sharma' },
        academicYear: { type: 'string', example: '2081-2082' },
        fees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'number', example: 1 },
              categoryName: { type: 'string', example: 'Tuition Fee' },
              amount: { type: 'number', example: 5000 },
              paid: { type: 'number', example: 2500 },
              dueDate: { type: 'string', example: '2081-04-15' },
              status: { type: 'string', example: 'PARTIAL' },
            },
          },
        },
        totalAmount: { type: 'number', example: 5000 },
        totalPaid: { type: 'number', example: 2500 },
        totalDue: { type: 'number', example: 2500 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentFees(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.feeService.getStudentFees(studentId, academicYear);
  }

  // Payments
  @Post('payments')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_PAYMENT)
  @ApiOperation({
    summary: 'Process Fee Payment',
    description: `Record a fee payment made by a student.

**Features:**
- Support for cash, bank transfer, cheque, digital payment
- Partial payment support
- Auto-generate receipt
- Update payment status

**Note:** Payment recorded by this endpoint cannot be reversed. Use refund for corrections.`,
  })
  @ApiBody({
    description: 'Payment data',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'number', example: 123 },
        schoolId: { type: 'number', example: 1 },
        categoryId: { type: 'number', example: 1 },
        amount: { type: 'number', example: 5000 },
        paymentDate: { type: 'string', example: '2081-04-10' },
        paymentMethod: {
          type: 'string',
          example: 'CASH',
          enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'DIGITAL_WALLET'],
        },
        transactionId: { type: 'string', example: 'TXN-2024-001' },
        notes: { type: 'string', example: 'First month tuition' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment processed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        transactionId: { type: 'string', example: 'TXN-2024-001' },
        amount: { type: 'number', example: 5000 },
        paymentDate: { type: 'string', example: '2081-04-10' },
        message: { type: 'string', example: 'Payment processed successfully' },
      },
    },
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
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Payment Receipt',
    description: `Generate payment receipt for a specific transaction.

**Returns:**
- Receipt details
- Student information
- Payment details
- School information
- Digital signature if configured`,
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
    schema: {
      type: 'object',
      properties: {
        receiptNumber: { type: 'string', example: 'RCP-2024-0001' },
        transactionId: { type: 'number', example: 1 },
        studentName: { type: 'string', example: 'Ram Sharma' },
        admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
        class: { type: 'string', example: 'Grade 10' },
        categoryName: { type: 'string', example: 'Tuition Fee' },
        amount: { type: 'number', example: 5000 },
        paymentDate: { type: 'string', example: '2081-04-10' },
        paymentMethod: { type: 'string', example: 'CASH' },
        schoolName: {
          type: 'string',
          example: 'Kathmandu Model Secondary School',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  generateReceipt(@Param('transactionId', ParseIntPipe) transactionId: number) {
    return this.feeService.generateReceipt(transactionId);
  }

  // Overdue Fees
  @Get('reminders/overdue')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Overdue Fees',
    description: `Retrieve list of students with overdue fees.

**Query Parameters:**
- schoolId: Required for filtering
- daysOverdue: Optional threshold (default: 30 days)

**Returns:**
- Student details
- Overdue amount
- Days overdue
- Contact information for reminder`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
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
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          studentId: { type: 'number', example: 123 },
          studentName: { type: 'string', example: 'Ram Sharma' },
          admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
          class: { type: 'string', example: 'Grade 10' },
          guardianMobile: { type: 'string', example: '9841234567' },
          overdueAmount: { type: 'number', example: 5000 },
          daysOverdue: { type: 'number', example: 45 },
          dueDate: { type: 'string', example: '2081-04-15' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getOverdueFees(
    @GetUser('schoolId') schoolId: number,
    @Query('daysOverdue', ParseIntPipe) daysOverdue?: number,
  ) {
    return this.feeService.getOverdueFees(schoolId, daysOverdue);
  }

  // Partial Payments
  @Post('payments/partial/:feeId')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_PAYMENT)
  @ApiOperation({
    summary: 'Process Partial Payment',
    description: `Record a partial payment for a specific fee.
    
    **Features:**
    - Pay any amount up to remaining balance
    - Idempotency key support for retry safety
    - Auto-updates fee payment status
    
    **Nepal Context:** Parents often negotiate and pay partial fees. This endpoint handles that workflow.`,
  })
  @ApiBody({
    description: 'Partial payment data',
    schema: {
      type: 'object',
      required: ['schoolId', 'amount', 'paymentDate', 'paymentMethod'],
      properties: {
        schoolId: { type: 'number', example: 1 },
        amount: {
          type: 'number',
          example: 2500,
          description: 'Amount cannot exceed remaining balance',
        },
        paymentDate: { type: 'string', example: '2024-04-15' },
        paymentMethod: {
          type: 'string',
          enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'DIGITAL_WALLET'],
          example: 'CASH',
        },
        transactionId: { type: 'string', example: 'TXN-2024-001' },
        remarks: { type: 'string', example: 'Partial payment for Baishakh' },
        idempotencyKey: {
          type: 'string',
          example: 'uuid-key-123',
          description: 'Prevent duplicate payments on retry',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Partial payment processed successfully',
    schema: {
      type: 'object',
      properties: {
        payment_id: { type: 'number', example: 15 },
        fee_id: { type: 'number', example: 23 },
        student_id: { type: 'number', example: 123 },
        amount: { type: 'number', example: 2500 },
        payment_method: { type: 'string', example: 'CASH' },
        payment_date: { type: 'string', example: '2024-04-15' },
        idempotency_key: { type: 'string', example: 'uuid-key-123' },
        is_verified: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Amount exceeds remaining balance' })
  @ApiResponse({ status: 404, description: 'Fee not found' })
  processPartialPayment(
    @Param('feeId', ParseIntPipe) feeId: number,
    @Body()
    createDto: {
      schoolId: number;
      amount: number;
      paymentDate: Date;
      paymentMethod: string;
      transactionId?: string;
      remarks?: string;
      idempotencyKey?: string;
    },
    @GetUser('userId') userId: number,
  ) {
    return this.feeService.processPartialPayment(feeId, createDto, userId);
  }

  @Get('payments/history/:studentId')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TEACHER)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Student Payment History',
    description: `Retrieve complete payment history for a student.
    
    **Use Cases:**
    - View all payments for fee clearance
    - Track partial payment installments
    - Audit trail for accounting`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    type: Number,
    example: 123,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Filter by academic year (optional)',
    example: '2081-2082',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          payment_id: { type: 'number', example: 15 },
          student_id: { type: 'number', example: 123 },
          amount: { type: 'number', example: 2500 },
          payment_method: { type: 'string', example: 'CASH' },
          payment_date: { type: 'string', example: '2024-04-15' },
          transaction_id: { type: 'string', example: 'TXN-2024-001' },
          idempotency_key: { type: 'string', example: 'uuid-key-123' },
        },
      },
    },
  })
  getPaymentHistory(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.feeService.getPaymentHistory(studentId, academicYear);
  }

  // Student Balance (Carry-forward)
  @Get('balance/:studentId')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Student Balance',
    description: `Get student balance including carry-forward from previous year.
    
    **Use Cases:**
    - Check outstanding balance
    - Verify carry-forward from previous academic year
    - Calculate total dues after adjustments`,
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    type: Number,
    example: 123,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Student balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        balance_id: { type: 'number', example: 1 },
        student_id: { type: 'number', example: 123 },
        academic_year: { type: 'string', example: '2081-2082' },
        brought_forward_amount: {
          type: 'number',
          example: 5000,
          description: 'Balance from previous year',
        },
        total_paid: { type: 'number', example: 10000 },
        total_due: { type: 'number', example: 15000 },
        current_balance: {
          type: 'number',
          example: 0,
          description: 'brought_forward + total_paid - total_due',
        },
      },
    },
  })
  getStudentBalance(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.feeService.getStudentBalance(studentId, academicYear);
  }

  @Post('balance/carry-forward')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Carry Forward Balance',
    description: `Carry forward outstanding balance from previous academic year.
    
    **Nepal Context:** Schools in Nepal commonly carry forward unpaid fees from one year to next.
    This is critical for schools managing student transitions between academic years.
    
    **Use Cases:**
    - Student promoted with unpaid fees
    - Installment plan carry-forward
    - Scholarship adjustment carry-over`,
  })
  @ApiBody({
    description: 'Carry forward balance data',
    schema: {
      type: 'object',
      required: ['studentId', 'fromAcademicYear', 'toAcademicYear', 'amount'],
      properties: {
        studentId: { type: 'number', example: 123 },
        fromAcademicYear: { type: 'string', example: '2080-2081' },
        toAcademicYear: { type: 'string', example: '2081-2082' },
        amount: {
          type: 'number',
          example: 5000,
          description: 'Amount to carry forward',
        },
        notes: { type: 'string', example: 'Unpaid tuition fee from last year' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Balance carried forward successfully',
    schema: {
      type: 'object',
      properties: {
        balance_id: { type: 'number', example: 2 },
        student_id: { type: 'number', example: 123 },
        academic_year: { type: 'string', example: '2081-2082' },
        brought_forward_amount: { type: 'number', example: 5000 },
        current_balance: { type: 'number', example: 5000 },
        message: {
          type: 'string',
          example: 'Balance carried forward successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  carryForwardBalance(
    @Body()
    createDto: {
      studentId: number;
      fromAcademicYear: string;
      toAcademicYear: string;
      amount: number;
      notes?: string;
    },
  ) {
    return this.feeService.carryForwardBalance(
      createDto.studentId,
      createDto.fromAcademicYear,
      createDto.toAcademicYear,
      createDto.amount,
      createDto.notes,
    );
  }

  // Late Fine Rules
  @Post('late-fine-rules')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Create Late Fine Rule',
    description: `Configure late payment fines for the school.
    
    **Fine Types:**
    - \`per_day\`: NPR X per day overdue (e.g., NPR 5/day)
    - \`flat\`: Flat NPR X after grace period (e.g., NPR 100 after 30 days)
    - \`percentage\`: X% of fee amount (e.g., 2% per month)
    
    **Nepal Context:** Schools often negotiate late fees with parents. This supports configurable rules
    with grace periods for flexibility.`,
  })
  @ApiBody({
    description: 'Late fine rule configuration',
    schema: {
      type: 'object',
      required: [
        'schoolId',
        'ruleName',
        'fineType',
        'fineAmount',
        'applicableFrom',
      ],
      properties: {
        schoolId: { type: 'number', example: 1 },
        ruleName: { type: 'string', example: 'Standard Late Fine' },
        fineType: {
          type: 'string',
          enum: ['per_day', 'flat', 'percentage'],
          example: 'per_day',
        },
        fineAmount: {
          type: 'number',
          example: 5,
          description: 'NPR amount or percentage',
        },
        gracePeriodDays: {
          type: 'number',
          example: 15,
          description: 'Days before fine applies',
        },
        maxFineAmount: {
          type: 'number',
          example: 500,
          description: 'Maximum fine cap',
        },
        applicableFrom: {
          type: 'string',
          example: '2024-04-01',
          description: 'Rule effective from date',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Late fine rule created successfully',
    schema: {
      type: 'object',
      properties: {
        fine_rule_id: { type: 'number', example: 1 },
        rule_name: { type: 'string', example: 'Standard Late Fine' },
        fine_type: { type: 'string', example: 'per_day' },
        fine_amount: { type: 'number', example: 5 },
        grace_period_days: { type: 'number', example: 15 },
        max_fine_amount: { type: 'number', example: 500 },
        is_active: { type: 'boolean', example: true },
      },
    },
  })
  createLateFineRule(
    @Body()
    createDto: {
      schoolId: number;
      ruleName: string;
      fineType: 'per_day' | 'flat' | 'percentage';
      fineAmount: number;
      gracePeriodDays?: number;
      maxFineAmount?: number;
      applicableFrom: Date;
    },
  ) {
    return this.feeService.createLateFineRule(createDto);
  }

  @Get('late-fine-rules')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Late Fine Rules',
    description: 'Retrieve all configured late fine rules for the school.',
  })
  @ApiResponse({
    status: 200,
    description: 'Late fine rules retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fine_rule_id: { type: 'number', example: 1 },
          rule_name: { type: 'string', example: 'Standard Late Fine' },
          fine_type: { type: 'string', example: 'per_day' },
          fine_amount: { type: 'number', example: 5 },
          grace_period_days: { type: 'number', example: 15 },
          max_fine_amount: { type: 'number', example: 500 },
          is_active: { type: 'boolean', example: true },
        },
      },
    },
  })
  getLateFineRules(@GetUser('schoolId') schoolId: number) {
    return this.feeService.getLateFineRules(schoolId);
  }

  @Get('calculate-fine')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Calculate Late Fine',
    description: `Calculate late fine for a given due date and amount.
    
    **Use Cases:**
    - Preview fine before applying
    - Check fine for specific student
    - Generate fine report`,
  })
  @ApiQuery({
    name: 'dueDate',
    description: 'Fee due date',
    example: '2024-03-15',
    required: true,
  })
  @ApiQuery({
    name: 'amount',
    description: 'Fee amount',
    example: 5000,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated fine details',
    schema: {
      type: 'object',
      properties: {
        fineAmount: { type: 'number', example: 150 },
        daysOverdue: { type: 'number', example: 30 },
        rule: {
          type: 'object',
          properties: {
            rule_name: { type: 'string', example: 'Standard Late Fine' },
            fine_type: { type: 'string', example: 'per_day' },
            grace_period_days: { type: 'number', example: 15 },
          },
        },
      },
    },
  })
  calculateLateFine(
    @GetUser('schoolId') schoolId: number,
    @Query('dueDate') dueDate: string,
    @Query('amount') amount: number,
  ) {
    return this.feeService.calculateLateFine(
      schoolId,
      new Date(dueDate),
      amount,
    );
  }

  // Scholarships with Approval Workflow
  @Post('scholarships')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Create Scholarship Request',
    description: `Request a scholarship/fee discount for a student.
    
    **Scholarship Types:**
    - \`merit\`: Academic performance based
    - \`need\`: Financial need based
    - \`staff\`: Staff ward discount
    - \`special\`: Special circumstances
    
    **Nepal Context:** Many Nepali schools offer scholarships to deserving students.
    This workflow ensures proper approval and audit trail.`,
  })
  @ApiBody({
    description: 'Scholarship request data',
    schema: {
      type: 'object',
      required: ['schoolId', 'studentId', 'scholarshipType', 'academicYear'],
      properties: {
        schoolId: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        scholarshipType: {
          type: 'string',
          enum: ['merit', 'need', 'staff', 'special'],
          example: 'merit',
        },
        discountPercent: {
          type: 'number',
          example: 25,
          description: 'Percentage discount (optional if discountAmount)',
        },
        discountAmount: {
          type: 'number',
          example: 5000,
          description: 'Fixed amount discount',
        },
        academicYear: { type: 'string', example: '2081-2082' },
        reason: { type: 'string', example: 'Top performer in SEE' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Scholarship request created',
    schema: {
      type: 'object',
      properties: {
        scholarship_id: { type: 'number', example: 1 },
        student_id: { type: 'number', example: 123 },
        scholarship_type: { type: 'string', example: 'merit' },
        discount_percent: { type: 'number', example: 25 },
        status: { type: 'string', example: 'pending' },
        requested_at: { type: 'string', example: '2024-04-15' },
      },
    },
  })
  createScholarship(
    @Body()
    createDto: {
      schoolId: number;
      studentId: number;
      scholarshipType: string;
      discountPercent?: number;
      discountAmount?: number;
      academicYear: string;
      reason?: string;
    },
  ) {
    return this.feeService.createScholarship(createDto);
  }

  @Get('scholarships')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Scholarships',
    description: 'Retrieve scholarship requests with optional filters.',
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Filter by academic year',
    example: '2081-2082',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by status',
    enum: ['pending', 'approved', 'rejected'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Scholarship list retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          scholarship_id: { type: 'number', example: 1 },
          student_id: { type: 'number', example: 123 },
          scholarship_type: { type: 'string', example: 'merit' },
          discount_percent: { type: 'number', example: 25 },
          status: { type: 'string', example: 'pending' },
          academic_year: { type: 'string', example: '2081-2082' },
        },
      },
    },
  })
  getScholarships(
    @GetUser('schoolId') schoolId: number,
    @Query('academicYear') academicYear?: string,
    @Query('status') status?: string,
  ) {
    return this.feeService.getScholarships(schoolId, academicYear, status);
  }

  @Post('scholarships/:id/approve')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.FEE_APPROVE)
  @ApiOperation({
    summary: 'Approve Scholarship',
    description:
      'Approve a scholarship request. This will apply the discount to student fees.',
  })
  @ApiParam({
    name: 'id',
    description: 'Scholarship ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approvedBy: { type: 'number', example: 1 },
        remarks: { type: 'string', example: 'Approved by principal' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Scholarship approved',
    schema: {
      type: 'object',
      properties: {
        scholarship_id: { type: 'number', example: 1 },
        status: { type: 'string', example: 'approved' },
        approved_at: { type: 'string', example: '2024-04-15' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Scholarship not in pending status',
  })
  approveScholarship(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approvedBy: number; remarks?: string },
  ) {
    return this.feeService.approveScholarship(
      id,
      body.approvedBy,
      body.remarks,
    );
  }

  @Post('scholarships/:id/reject')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.FEE_APPROVE)
  @ApiOperation({
    summary: 'Reject Scholarship',
    description: 'Reject a scholarship request with reason.',
  })
  @ApiParam({
    name: 'id',
    description: 'Scholarship ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['approvedBy', 'remarks'],
      properties: {
        approvedBy: { type: 'number', example: 1 },
        remarks: {
          type: 'string',
          example: 'Does not meet scholarship criteria',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Scholarship rejected' })
  rejectScholarship(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approvedBy: number; remarks: string },
  ) {
    return this.feeService.rejectScholarship(id, body.approvedBy, body.remarks);
  }

  // Sibling Discounts
  @Post('sibling-discounts')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Create Sibling Discount',
    description: `Apply sibling discount for families with multiple children in the school.
    
    **Nepal Context:** Nepali parents often negotiate sibling discounts.
    Common: 10% discount for 2nd child, 15% for 3rd child, etc.
    
    **Example:**
    - 2 siblings: 10% discount
    - 3 siblings: 15% discount
    - 4+ siblings: 20% discount`,
  })
  @ApiBody({
    description: 'Sibling discount data',
    schema: {
      type: 'object',
      required: [
        'schoolId',
        'studentId',
        'siblingCount',
        'discountPercent',
        'academicYear',
      ],
      properties: {
        schoolId: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        siblingCount: {
          type: 'number',
          example: 2,
          description: 'Number of siblings in school',
        },
        discountPercent: { type: 'number', example: 10 },
        academicYear: { type: 'string', example: '2081-2082' },
        familyId: {
          type: 'string',
          example: 'FAM-001',
          description: 'Optional family identifier',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Sibling discount created' })
  createSiblingDiscount(
    @Body()
    createDto: {
      schoolId: number;
      studentId: number;
      siblingCount: number;
      discountPercent: number;
      academicYear: string;
      familyId?: string;
    },
  ) {
    return this.feeService.createSiblingDiscount(createDto);
  }

  @Get('sibling-discounts')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Sibling Discounts',
    description: 'Retrieve all sibling discounts for the school.',
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Filter by academic year',
    example: '2081-2082',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Sibling discounts list' })
  getSiblingDiscounts(
    @GetUser('schoolId') schoolId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.feeService.getSiblingDiscounts(schoolId, academicYear);
  }

  // Fee Waiver Requests
  @Post('waiver-requests')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_CREATE)
  @ApiOperation({
    summary: 'Create Fee Waiver Request',
    description: `Request a fee waiver for a student due to special circumstances.
    
    **Waiver Types:**
    - \`full\`: Complete fee waiver
    - \`partial\`: Partial fee reduction
    - \`temporary\`: Temporary suspension of fees
    
    **Nepal Context:** Parents often negotiate fee waivers for special cases
    (natural disasters, medical emergencies, economic hardship).`,
  })
  @ApiBody({
    description: 'Fee waiver request data',
    schema: {
      type: 'object',
      required: ['schoolId', 'studentId', 'waiverType', 'requestedAmount'],
      properties: {
        schoolId: { type: 'number', example: 1 },
        studentId: { type: 'number', example: 123 },
        feeId: {
          type: 'number',
          example: 45,
          description: 'Specific fee to waive (optional)',
        },
        waiverType: {
          type: 'string',
          enum: ['full', 'partial', 'temporary'],
          example: 'partial',
        },
        requestedAmount: { type: 'number', example: 2500 },
        reason: { type: 'string', example: 'Family affected by flood' },
        supportingDocuments: {
          type: 'array',
          items: { type: 'string' },
          example: ['doc1.pdf'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fee waiver request created' })
  createFeeWaiverRequest(
    @Body()
    createDto: {
      schoolId: number;
      studentId: number;
      feeId?: number;
      waiverType: string;
      requestedAmount: number;
      reason?: string;
      supportingDocuments?: string[];
    },
  ) {
    return this.feeService.createFeeWaiverRequest(createDto);
  }

  @Get('waiver-requests')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Permissions(Permission.FEE_READ)
  @ApiOperation({
    summary: 'Get Fee Waiver Requests',
    description: 'Retrieve fee waiver requests with optional filters.',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by status',
    enum: ['pending', 'approved', 'rejected'],
    required: false,
  })
  @ApiQuery({
    name: 'studentId',
    description: 'Filter by student',
    type: Number,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Fee waiver requests list' })
  getFeeWaiverRequests(
    @GetUser('schoolId') schoolId: number,
    @Query('status') status?: string,
    @Query('studentId') studentId?: number,
  ) {
    return this.feeService.getFeeWaiverRequests(schoolId, status, studentId);
  }

  @Post('waiver-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.FEE_APPROVE)
  @ApiOperation({
    summary: 'Approve Fee Waiver',
    description:
      'Approve a fee waiver request. This will apply the waiver to the student fee.',
  })
  @ApiParam({
    name: 'id',
    description: 'Waiver request ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['approvedBy', 'approvedAmount'],
      properties: {
        approvedBy: { type: 'number', example: 1 },
        approvedAmount: {
          type: 'number',
          example: 2500,
          description: 'Approved waiver amount',
        },
        remarks: {
          type: 'string',
          example: 'Approved due to medical emergency',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fee waiver approved' })
  @ApiResponse({ status: 400, description: 'Waiver not in pending status' })
  approveFeeWaiver(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { approvedBy: number; approvedAmount: number; remarks?: string },
  ) {
    return this.feeService.approveFeeWaiver(
      id,
      body.approvedBy,
      body.approvedAmount,
      body.remarks,
    );
  }

  @Post('waiver-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.FEE_APPROVE)
  @ApiOperation({
    summary: 'Reject Fee Waiver',
    description: 'Reject a fee waiver request with reason.',
  })
  @ApiParam({
    name: 'id',
    description: 'Waiver request ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['approvedBy', 'remarks'],
      properties: {
        approvedBy: { type: 'number', example: 1 },
        remarks: { type: 'string', example: 'Does not meet waiver criteria' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Fee waiver rejected' })
  rejectFeeWaiver(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approvedBy: number; remarks: string },
  ) {
    return this.feeService.rejectFeeWaiver(id, body.approvedBy, body.remarks);
  }
}
