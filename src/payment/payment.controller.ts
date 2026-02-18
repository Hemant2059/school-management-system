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

class InitiatePaymentDto {
  amount: number;
  studentId: number;
  feeId?: number;
  mobile?: string;
  description?: string;
  gateway?: 'ekhalti' | 'connectips';
}

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @Roles('admin', 'accountant')
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
  async verifyPayment(
    transactionId: string,
    @Query('gateway') gateway: 'ekhalti' | 'connectips' = 'ekhalti',
  ): Promise<PaymentVerification> {
    return this.paymentService.verifyPayment(transactionId, gateway);
  }

  @Post('callback/ekhalti')
  async handleEkhaltiCallback(@Body() data: any) {
    return this.paymentService.handlePaymentCallback(data, 'ekhalti');
  }

  @Post('callback/connectips')
  async handleConnectIpsCallback(@Body() data: any) {
    return this.paymentService.handlePaymentCallback(data, 'connectips');
  }

  @Get('qr-code')
  @Roles('admin', 'accountant', 'teacher', 'student', 'guardian')
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
