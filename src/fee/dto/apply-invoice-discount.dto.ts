import {
  IsNotEmpty,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyInvoiceDiscountDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Student ID', example: 101 })
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({ description: 'Discount rule ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly discountRuleId: number;

  @ApiPropertyOptional({
    description: 'Academic year ID (defaults to the invoice year)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  readonly academicYearId?: number;

  @ApiPropertyOptional({
    description:
      'Invoice ID (defaults to the latest open invoice for the student)',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  readonly invoiceId?: number;
}
