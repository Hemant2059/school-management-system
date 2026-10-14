import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradeScaleDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  readonly schoolId: number;

  @ApiProperty({ description: 'Grade name (e.g., A+, A, B+)', example: 'A+' })
  @IsNotEmpty()
  @IsString()
  readonly gradeName: string;

  @ApiProperty({ description: 'Minimum percentage', example: 90 })
  @IsNotEmpty()
  @IsNumber()
  readonly minPercentage: number;

  @ApiProperty({ description: 'Maximum percentage', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  readonly maxPercentage: number;

  @ApiProperty({ description: 'Grade point', example: 4.0 })
  @IsNotEmpty()
  @IsNumber()
  readonly gradePoint: number;

  @ApiPropertyOptional({ description: 'Grade label', example: 'Outstanding' })
  @IsOptional()
  @IsString()
  readonly gradeLabel?: string;

  @ApiPropertyOptional({
    description: 'Remark in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  readonly remarkNp?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  readonly description?: string;
}

export class UpdateGradeScaleDto {
  @ApiPropertyOptional({ description: 'Grade name' })
  @IsOptional()
  @IsString()
  readonly gradeName?: string;

  @ApiPropertyOptional({ description: 'Minimum percentage' })
  @IsOptional()
  @IsNumber()
  readonly minPercentage?: number;

  @ApiPropertyOptional({ description: 'Maximum percentage' })
  @IsOptional()
  @IsNumber()
  readonly maxPercentage?: number;

  @ApiPropertyOptional({ description: 'Grade point' })
  @IsOptional()
  @IsNumber()
  readonly gradePoint?: number;

  @ApiPropertyOptional({ description: 'Grade label' })
  @IsOptional()
  @IsString()
  readonly gradeLabel?: string;

  @ApiPropertyOptional({
    description: 'Remark in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  readonly remarkNp?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  readonly description?: string;
}
