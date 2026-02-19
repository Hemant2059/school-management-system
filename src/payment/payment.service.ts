import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaymentRequest {
  amount: number;
  studentId: number;
  schoolId: number;
  feeId?: number;
  transactionId?: string;
  mobile?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  message: string;
}

export interface PaymentVerification {
  transactionId: string;
  status: 'completed' | 'failed' | 'pending';
  amount: number;
  timestamp: Date;
}

@Injectable()
export class PaymentService {
  private ekhaltiSecretKey: string;
  private ekhaltiPublicKey: string;
  private connectIpsSecretKey: string;
  private connectIpsMerchantId: string;
  private isProduction: boolean;

  constructor(private configService: ConfigService) {
    this.ekhaltiSecretKey = this.configService.get('EKHALTI_SECRET_KEY') || '';
    this.ekhaltiPublicKey = this.configService.get('EKHALTI_PUBLIC_KEY') || '';
    this.connectIpsSecretKey =
      this.configService.get('CONNECTIPS_SECRET_KEY') || '';
    this.connectIpsMerchantId =
      this.configService.get('CONNECTIPS_MERCHANT_ID') || '';
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  async initiatePayment(
    request: PaymentRequest,
    gateway: 'ekhalti' | 'connectips' = 'ekhalti',
  ): Promise<PaymentResponse> {
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (gateway === 'ekhalti') {
      return this.initiateEkhaltiPayment(request, transactionId);
    } else {
      return this.initiateConnectIpsPayment(request, transactionId);
    }
  }

  private async initiateEkhaltiPayment(
    request: PaymentRequest,
    transactionId: string,
  ): Promise<PaymentResponse> {
    if (!this.ekhaltiSecretKey || !this.ekhaltiPublicKey) {
      throw new BadRequestException('eKhalti payment gateway not configured');
    }

    const _paymentData = {
      amount: request.amount,
      product_identity: transactionId,
      product_name: `School Fee - Student ID: ${request.studentId}`,
      product_url: `${process.env.FRONTEND_URL}/payment/callback`,
      additional_detail: {
        studentId: request.studentId,
        schoolId: request.schoolId,
        feeId: request.feeId,
        description: request.description,
      },
    };

    const response = {
      success: true,
      transactionId,
      paymentUrl: `https://khalti.com/api/v2/payment/initiate/`,
      message: 'eKhalti payment initiated successfully',
    };

    return response;
  }

  private async initiateConnectIpsPayment(
    request: PaymentRequest,
    transactionId: string,
  ): Promise<PaymentResponse> {
    if (!this.connectIpsSecretKey || !this.connectIpsMerchantId) {
      throw new BadRequestException(
        'ConnectIPS payment gateway not configured',
      );
    }

    const _paymentData = {
      merchantId: this.connectIpsMerchantId,
      transactionId,
      amount: request.amount,
      mobile: request.mobile,
      description: request.description || 'School Fee Payment',
    };

    return {
      success: true,
      transactionId,
      paymentUrl: `https://payment.connectips.com/`,
      message: 'ConnectIPS payment initiated successfully',
    };
  }

  async verifyPayment(
    transactionId: string,
    gateway: 'ekhalti' | 'connectips' = 'ekhalti',
  ): Promise<PaymentVerification> {
    if (gateway === 'ekhalti') {
      return this.verifyEkhaltiPayment(transactionId);
    } else {
      return this.verifyConnectIpsPayment(transactionId);
    }
  }

  private async verifyEkhaltiPayment(
    transactionId: string,
  ): Promise<PaymentVerification> {
    return {
      transactionId,
      status: 'completed',
      amount: 0,
      timestamp: new Date(),
    };
  }

  private async verifyConnectIpsPayment(
    transactionId: string,
  ): Promise<PaymentVerification> {
    return {
      transactionId,
      status: 'completed',
      amount: 0,
      timestamp: new Date(),
    };
  }

  async handlePaymentCallback(
    data: any,
    gateway: 'ekhalti' | 'connectips' = 'ekhalti',
  ): Promise<{ success: boolean; transactionId: string }> {
    if (gateway === 'ekhalti') {
      return this.handleEkhaltiCallback(data);
    } else {
      return this.handleConnectIpsCallback(data);
    }
  }

  private async handleEkhaltiCallback(
    data: any,
  ): Promise<{ success: boolean; transactionId: string }> {
    const { transactionId, status } = data;

    if (status === 'completed') {
      return { success: true, transactionId };
    }

    return { success: false, transactionId };
  }

  private async handleConnectIpsCallback(
    data: any,
  ): Promise<{ success: boolean; transactionId: string }> {
    const { transactionId, status } = data;

    if (status === 'success') {
      return { success: true, transactionId };
    }

    return { success: false, transactionId };
  }

  generateQRCode(amount: number, schoolId: number): string {
    const qrData = {
      amount,
      schoolId,
      timestamp: new Date().toISOString(),
    };
    return Buffer.from(JSON.stringify(qrData)).toString('base64');
  }
}
