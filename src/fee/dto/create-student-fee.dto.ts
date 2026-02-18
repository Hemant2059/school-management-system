import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsDate,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentFeeDto {
  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Student ID',
    example: 101,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({
    description: 'Fee type (e.g., tuition, exam, transport)',
    example: 'tuition',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly feeType: string;

  @ApiProperty({
    description: 'Fee amount in NPR',
    example: 50000,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 1000.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Fine amount',
    example: 500.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly fineAmount?: number;

  @ApiProperty({
    description: 'Total amount due',
    example: 54500.0,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly totalAmount: number;

  @ApiProperty({
    description: 'Due date',
    example: '2024-06-30T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly dueDate: Date;

  @ApiPropertyOptional({
    description: 'Academic year (e.g., 2081)',
    example: '2081',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly academicYear?: string;

  @ApiPropertyOptional({
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly classId?: number;

  @ApiPropertyOptional({
    description: 'Section ID',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly sectionId?: number;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2081-001',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Discount type (percentage or fixed)',
    example: 'percentage',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly discountType?: string;

  @ApiPropertyOptional({
    description: 'Discount percentage',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly discountPercent?: number;

  @ApiPropertyOptional({
    description: 'Fine type (percentage or fixed)',
    example: 'percentage',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly fineType?: string;

  @ApiPropertyOptional({
    description: 'Fine percentage',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly finePercent?: number;

  @ApiPropertyOptional({
    description: 'Scholarship percentage',
    example: 25,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly scholarshipPercent?: number;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'First installment',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly notes?: string;
}
