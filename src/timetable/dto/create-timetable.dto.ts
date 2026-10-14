import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimetableDto {
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
    description: 'Subject ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly subjectId: number;

  @ApiProperty({
    description: 'Teacher ID assigned to this period',
    example: 3,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly teacherId: number;

  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
    type: Number,
    minimum: 0,
    maximum: 6,
  })
  @IsNotEmpty()
  @Min(0)
  @Max(6)
  readonly dayOfWeek: number;

  @ApiPropertyOptional({
    description: 'Day of week in Nepali (provided by frontend)',
    example: 'सोमबार',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly dayOfWeekNp?: string;

  @ApiProperty({
    description: 'Period start time (HH:MM format)',
    example: '09:00',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly startTime: string;

  @ApiProperty({
    description: 'Period end time (HH:MM format)',
    example: '09:45',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly endTime: string;

  @ApiProperty({
    description: 'Period number in the day',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  readonly periodNumber: number;

  @ApiPropertyOptional({
    description: 'Room/classroom number',
    example: 'Room 201',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly roomNumber?: string;
}
