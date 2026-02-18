import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicClassDto {
  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Class name (e.g., "Grade 1", "Class 10")',
    example: 'Grade 5',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly className: string; // e.g., "Grade 1"

  @ApiProperty({
    description: 'Short class code for identification',
    example: 'G5',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly classCode: string; // e.g., "G1"

  @ApiProperty({
    description: 'Numeric order/level of class (1-12)',
    example: 5,
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsNotEmpty()
  @IsInt()
  readonly classOrder: number; // 1 to 12

  @ApiProperty({
    description: 'Education level category',
    example: 'PRIMARY',
    enum: ['PRIMARY', 'LOWER_SECONDARY', 'SECONDARY', 'HIGHER_SECONDARY'],
  })
  @IsNotEmpty()
  @IsEnum(['PRIMARY', 'LOWER_SECONDARY', 'SECONDARY', 'HIGHER_SECONDARY'])
  readonly educationLevel: string;

  @ApiPropertyOptional({
    description: 'Minimum age requirement for this class',
    example: 9,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly minAge?: number;

  @ApiPropertyOptional({
    description: 'Maximum age allowed for this class',
    example: 11,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly maxAge?: number;
}
