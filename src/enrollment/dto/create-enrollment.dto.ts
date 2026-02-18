import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNebSeeRegistration } from '../../common/validators/neb-registration.validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Academic class ID',
    example: 5,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly classId: number;

  @ApiPropertyOptional({
    description: 'Section ID (optional)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly sectionId?: number;

  @ApiProperty({
    description: 'Academic year in BS format',
    example: '2081-2082',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly academicYear: string; // e.g., "2081-2082"

  @ApiProperty({
    description: 'Enrollment date',
    example: '2024-04-15T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly enrollmentDate: Date;

  @ApiPropertyOptional({
    description: 'Enrollment status',
    example: 'ACTIVE',
    enum: [
      'ACTIVE',
      'PROMOTED',
      'REPEATED',
      'TRANSFERRED_OUT',
      'DROPPED',
      'GRADUATED',
    ],
  })
  @IsOptional()
  @IsEnum([
    'ACTIVE',
    'PROMOTED',
    'REPEATED',
    'TRANSFERRED_OUT',
    'DROPPED',
    'GRADUATED',
  ])
  readonly status?: string;

  @ApiPropertyOptional({
    description: 'Student roll number',
    example: 'ROLL-2024-001',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly rollNumber?: string;

  @ApiPropertyOptional({
    description:
      'SEE/NEB board exam registration (5–20 alphanumeric). Only applicable for classes 8, 9, 10, 11, 12; ignored for other classes.',
    example: '12345678',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNebSeeRegistration()
  readonly boardExamRegistration?: string;
}
