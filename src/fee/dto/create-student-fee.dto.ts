import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentFeeDto {
  @ApiProperty({ description: 'Student ID', example: 101 })
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({ description: 'Fee Structure ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly feeStructureId: number;

  @ApiProperty({ description: 'Academic Year ID', example: 2024 })
  @IsNotEmpty()
  @IsInt()
  readonly academicYearId: number;

  @ApiProperty({ description: 'Total amount due', example: 12000.0 })
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 1000.0 })
  @IsOptional()
  @IsNumber()
  readonly discountAmount?: number;

  @ApiPropertyOptional({ description: 'Waiver amount', example: 500.0 })
  @IsOptional()
  @IsNumber()
  readonly waiverAmount?: number;

  @ApiPropertyOptional({ description: 'Installment number', example: 1 })
  @IsOptional()
  @IsInt()
  readonly installmentNumber?: number;

  @ApiPropertyOptional({ description: 'Due date', example: '2024-05-15' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly dueDate?: Date;
}
