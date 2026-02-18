import {
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDate,
  IsString,
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
    description: 'Academic year (e.g., 2081)',
    example: '2081',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly academicYear: string;

  @ApiProperty({
    description: 'Academic class ID',
    example: 5,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly classId: number;

  @ApiPropertyOptional({
    description: 'Stream ID (for classes 11-12)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly streamId?: number;

  @ApiPropertyOptional({
    description: 'Section ID (optional, null means applies to all sections)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly sectionId?: number;

  @ApiProperty({
    description: 'Fee type (e.g., tuition, exam, transport, library)',
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
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @ApiPropertyOptional({
    description: 'Whether fee is recurring',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  readonly isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Fee frequency (monthly, quarterly, yearly)',
    example: 'yearly',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly feeFrequency?: string;

  @ApiPropertyOptional({
    description: 'Fee payment due date',
    example: '2024-06-30T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Due date in Bikram Sambat (e.g., 2081-03-15)',
    example: '2081-03-15',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly dueDateBs?: string;

  @ApiPropertyOptional({
    description: 'Whether fee is mandatory',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  readonly isMandatory?: boolean;
}
