import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLiveClassDto {
  @ApiProperty({
    description: 'Title of the live class',
    example: 'Math Class',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Class description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Class ID', example: 1 })
  @IsOptional()
  @IsInt()
  classId?: number;

  @ApiPropertyOptional({ description: 'Section ID', example: 1 })
  @IsOptional()
  @IsInt()
  sectionId?: number;

  @ApiPropertyOptional({ description: 'Subject ID', example: 1 })
  @IsOptional()
  @IsInt()
  subjectId?: number;

  @ApiPropertyOptional({ description: 'Teacher ID', example: 1 })
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @ApiProperty({
    description: 'Scheduled start time',
    example: '2026-03-01T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 45 })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional({ enum: ['jitsi', 'zoom', 'meet'], example: 'zoom' })
  @IsOptional()
  @IsEnum(['jitsi', 'zoom', 'meet'])
  platform?: 'jitsi' | 'zoom' | 'meet';

  @ApiPropertyOptional({ description: 'Enable recording', example: false })
  @IsOptional()
  @IsBoolean()
  recordingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'School ID', example: 1 })
  @IsOptional()
  @IsInt()
  schoolId?: number;
}

export class EndLiveClassDto {
  @ApiPropertyOptional({ description: 'Recording URL after class ends' })
  @IsOptional()
  @IsString()
  recordingUrl?: string;
}
