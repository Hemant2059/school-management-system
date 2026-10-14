import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Exam Schedule Released',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiPropertyOptional({
    description:
      'Notification title in Nepali (provided by frontend, stored verbatim)',
    example: 'परीक्षा तालिका प्रकाशित',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly titleNp?: string;

  @ApiProperty({
    description: 'Notification message in English',
    example: 'First terminal examination schedule has been published.',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly message: string;

  @ApiPropertyOptional({
    description:
      'Notification message in Nepali (provided by frontend, stored verbatim)',
    example: 'पहिलो टर्मिनल परीक्षाको तालिका प्रकाशन गरिएको छ।',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly messageNp?: string;

  @ApiProperty({
    description: 'Notification type/category',
    example: 'EXAM',
    enum: ['INFO', 'WARNING', 'URGENT', 'EXAM', 'FEE', 'ATTENDANCE', 'RESULT'],
  })
  @IsNotEmpty()
  @IsEnum(['INFO', 'WARNING', 'URGENT', 'EXAM', 'FEE', 'ATTENDANCE', 'RESULT'])
  readonly type: string;

  @ApiPropertyOptional({
    description: 'School ID (null for system-wide notifications)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly schoolId?: number;

  @ApiPropertyOptional({
    description: 'Class ID to target specific class',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly classId?: number;

  @ApiPropertyOptional({
    description: 'Section ID to target specific section',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly sectionId?: number;

  @ApiPropertyOptional({
    description: 'Student ID for student-specific notifications',
    example: 123,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly studentId?: number;

  @ApiPropertyOptional({
    description: 'Guardian ID for parent-specific notifications',
    example: 45,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly guardianId?: number;
}
