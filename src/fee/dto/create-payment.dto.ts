import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsInt()
  readonly studentFeeId: number;

  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

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

  @IsOptional()
  @IsString()
  readonly transactionReference?: string;

  @IsOptional()
  @IsString()
  readonly bankName?: string;

  @IsOptional()
  @IsString()
  readonly chequeNumber?: string;

  @IsOptional()
  @IsString()
  readonly remarks?: string;
}
