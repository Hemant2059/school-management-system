import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Subject name',
    example: 'Mathematics',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly subjectName: string;

  @ApiProperty({
    description: 'ID of the school this subject belongs to',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly schoolId: number;

  @ApiPropertyOptional({
    description: 'Subject name in Nepali',
    example: 'गणित',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly subjectNameNepali?: string;

  @ApiProperty({
    description: 'Unique subject code',
    example: 'MATH-101',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly subjectCode: string;

  @ApiPropertyOptional({
    description: 'Type of subject',
    example: 'COMPULSORY',
    enum: ['COMPULSORY', 'ELECTIVE', 'OPTIONAL', 'ADDITIONAL'],
  })
  @IsOptional()
  @IsEnum(['COMPULSORY', 'ELECTIVE', 'OPTIONAL', 'ADDITIONAL'])
  readonly subjectType?: string;

  @ApiPropertyOptional({
    description: 'Subject group or faculty',
    example: 'SCIENCE',
    enum: ['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'])
  readonly subjectGroup?: string;

  @ApiPropertyOptional({
    description: 'Credit hours for the subject',
    example: 4,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly creditHours?: number;

  @ApiPropertyOptional({
    description: 'Whether subject has theory component',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  readonly isTheory?: boolean;

  @ApiPropertyOptional({
    description: 'Whether subject has practical component',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  readonly isPractical?: boolean;
}
