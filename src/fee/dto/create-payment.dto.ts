import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiPropertyOptional({
    description: 'Invoice ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly invoiceId?: number;

  @ApiProperty({
    description: 'Student ID',
    example: 101,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({
    description: 'Payment amount',
    example: 10000.0,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiProperty({
    description: 'Payment date',
    example: '2024-06-15T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly paymentDate: Date;

  @ApiPropertyOptional({
    description: 'Payment date in Bikram Sambat',
    example: '2081-02-31',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly paymentDateBs?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: [
      'CASH',
      'BANK',
      'CHEQUE',
      'ESEWA',
      'KHALTI',
      'FONEPAY',
      'CONNECTIPS',
      'IMEPAY',
      'OTHER',
    ],
    example: 'KHALTI',
  })
  @IsNotEmpty()
  @IsEnum([
    'CASH',
    'BANK',
    'CHEQUE',
    'ESEWA',
    'KHALTI',
    'FONEPAY',
    'CONNECTIPS',
    'IMEPAY',
    'OTHER',
  ])
  readonly paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Transaction ID from payment gateway',
    example: 'TXN-123456',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly transactionId?: string;

  @ApiPropertyOptional({
    description: 'Transaction UUID for payment gateway',
    example: 'uuid-string',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly transactionUuid?: string;

  @ApiPropertyOptional({
    description: 'Payment gateway name',
    example: 'KHALTI',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly gatewayName?: string;

  @ApiPropertyOptional({
    description: 'Received by user ID',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly receivedBy?: number;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'NMB Bank',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly bankName?: string;

  @ApiPropertyOptional({
    description: 'Branch name',
    example: 'Kathmandu Branch',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly branchName?: string;

  @ApiPropertyOptional({
    description: 'Cheque number',
    example: 'CHQ-001234',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly chequeNumber?: string;

  @ApiPropertyOptional({
    description: 'Cheque date',
    example: '2024-06-15',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly chequeDate?: Date;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'REF-123456',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Payment for June tuition',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly remarks?: string;
}
