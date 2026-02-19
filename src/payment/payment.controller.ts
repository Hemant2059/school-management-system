import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  PaymentService,
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
} from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';

class InitiatePaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 5000 })
  amount: number;
  @ApiProperty({ description: 'Student ID', example: 123 })
  studentId: number;
  @ApiProperty({
    description: 'Fee ID (optional)',
    example: 1,
    required: false,
  })
  feeId?: number;
  @ApiProperty({
    description: 'Mobile number (optional)',
    example: '9841234567',
    required: false,
  })
  mobile?: string;
  @ApiProperty({
    description: 'Payment description (optional)',
    example: 'Tuition fee',
    required: false,
  })
  description?: string;
  @ApiProperty({
    description: 'Payment gateway',
    example: 'ekhalti',
    enum: ['ekhalti', 'connectips'],
  })
  gateway?: 'ekhalti' | 'connectips';
}

@ApiTags('Payment Management')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @Roles('admin', 'accountant')
  @ApiOperation({
    summary: 'Initiate payment',
    description: 'Start a payment transaction for student fees.',
  })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Accountant role required',
  })
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @Req() req,
  ): Promise<PaymentResponse> {
    const paymentRequest: PaymentRequest = {
      amount: dto.amount,
      studentId: dto.studentId,
      schoolId: req.user.schoolId,
      feeId: dto.feeId,
      description: dto.description,
      mobile: dto.mobile,
    };

    return this.paymentService.initiatePayment(paymentRequest, dto.gateway);
  }

  @Get('verify/:transactionId')
  @Roles('admin', 'accountant')
  @ApiOperation({
    summary: 'Verify payment',
    description: 'Verify status of a payment transaction.',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Transaction ID from payment gateway',
    example: 'TXN123456',
    type: String,
  })
  @ApiQuery({
    name: 'gateway',
    description: 'Payment gateway',
    example: 'ekhalti',
    enum: ['ekhalti', 'connectips'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verification result',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Accountant role required',
  })
  async verifyPayment(
    transactionId: string,
    @Query('gateway') gateway: 'ekhalti' | 'connectips' = 'ekhalti',
  ): Promise<PaymentVerification> {
    return this.paymentService.verifyPayment(transactionId, gateway);
  }

  @Post('callback/ekhalti')
  @ApiOperation({
    summary: 'Ekhalti callback',
    description: 'Handle payment callback from Ekhalti gateway.',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async handleEkhaltiCallback(@Body() data: any) {
    return this.paymentService.handlePaymentCallback(data, 'ekhalti');
  }

  @Post('callback/connectips')
  @ApiOperation({
    summary: 'Connect IPS callback',
    description: 'Handle payment callback from Connect IPS gateway.',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async handleConnectIpsCallback(@Body() data: any) {
    return this.paymentService.handlePaymentCallback(data, 'connectips');
  }

  @Get('qr-code')
  @Roles('admin', 'accountant', 'teacher', 'student', 'guardian')
  @ApiOperation({
    summary: 'Generate payment QR code',
    description: 'Generate a QR code for making payments.',
  })
  @ApiQuery({
    name: 'amount',
    description: 'Payment amount',
    example: 5000,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateQRCode(
    @Query('amount') amount: number,
    @Req() req,
  ): Promise<{ qrCode: string }> {
    const qrCode = this.paymentService.generateQRCode(
      amount,
      req.user.schoolId,
    );
    return { qrCode };
  }
}
