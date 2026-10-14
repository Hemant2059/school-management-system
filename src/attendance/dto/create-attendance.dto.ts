import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'Student ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
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
    description: 'Attendance date',
    example: '2024-02-16T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly attendanceDate: Date;

  @ApiProperty({
    description: 'Attendance status',
    example: 'PRESENT',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'],
  })
  @IsNotEmpty()
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'])
  readonly status: string;

  @ApiProperty({
    description: 'Academic year in BS format',
    example: '2081-2082',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly academicYear: string; // e.g., "2081-2082"

  @ApiPropertyOptional({
    description: 'Session time',
    example: 'FULL_DAY',
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY'],
  })
  @IsOptional()
  @IsEnum(['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY'])
  readonly session?: string;

  @ApiPropertyOptional({
    description: 'Additional remarks or notes',
    example: 'Medical leave',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly remarks?: string;

  @ApiPropertyOptional({
    description: 'Remarks in Nepali (provided by frontend)',
    example: 'टिप्पणी',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly remarksNp?: string;

  @ApiPropertyOptional({
    description: 'Attendance date in Bikram Sambat',
    example: '2081-11-02',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly attendanceDateBs?: string;

  @ApiPropertyOptional({
    description: 'Check-in time (HH:MM format)',
    example: '08:30',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly checkInTime?: string;

  @ApiPropertyOptional({
    description: 'Check-out time (HH:MM format)',
    example: '14:30',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly checkOutTime?: string;

  @ApiPropertyOptional({
    description: 'Biometric device ID',
    example: 'BIO-001',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly biometricDeviceId?: string;
}
