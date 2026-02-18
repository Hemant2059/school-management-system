import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeStructureDto {
  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Academic year ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly academicYearId: number;

  @ApiProperty({
    description: 'Academic class ID',
    example: 5,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly classId: number;

  @ApiPropertyOptional({
    description: 'Section ID (optional, null means applies to all sections)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly sectionId?: number;

  @ApiProperty({
    description: 'Fee category ID (e.g., Tuition, Exam, Transport)',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly categoryId: number;

  @ApiProperty({
    description: 'Fee amount in NPR',
    example: 50000,
    type: Number,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiPropertyOptional({
    description: 'Whether fee can be paid in installments',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  readonly isInstallment?: boolean;

  @ApiPropertyOptional({
    description: 'Number of installments allowed',
    example: 4,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  readonly installmentCount?: number;

  @ApiPropertyOptional({
    description: 'Fee payment due date',
    example: '2024-06-30T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly dueDate?: Date;
}
