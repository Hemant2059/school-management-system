import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
  @IsNotEmpty()
  @IsString()
  readonly examName: string;

  @ApiPropertyOptional({
    description: 'Exam name in Nepali (provided by frontend)',
    example: 'परीक्षा',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly examNameNp?: string;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Unique exam code',
    example: 'EXAM-2024-T1',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly examCode: string;

  @ApiProperty({
    description: 'Type of examination',
    example: 'TERMINAL',
    enum: ['UNIT_TEST', 'TERMINAL', 'FINAL', 'SEE', 'NEB', 'BOARD', 'OTHER'],
  })
  @IsNotEmpty()
  @IsEnum(['UNIT_TEST', 'TERMINAL', 'FINAL', 'SEE', 'NEB', 'BOARD', 'OTHER'])
  readonly examType: string;

  @ApiProperty({
    description: 'Academic class ID',
    example: 5,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly classId: number;

  @ApiPropertyOptional({
    description: 'Section ID (optional, null means for all sections)',
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
    description: 'Exam date',
    example: '2024-03-15T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly examDate: Date; // ✅ Critical: Must exist

  @ApiPropertyOptional({
    description: 'Exam start time (HH:MM format)',
    example: '09:00',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly startTime?: string;

  @ApiPropertyOptional({
    description: 'Exam end time (HH:MM format)',
    example: '12:00',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly endTime?: string;

  @ApiProperty({
    description: 'Maximum marks for the exam',
    example: 100,
    type: Number,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  readonly fullMarks: number;

  @ApiProperty({
    description: 'Passing marks for the exam',
    example: 40,
    type: Number,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsInt()
  readonly passMarks: number;

  @ApiPropertyOptional({
    description: 'Exam date in Bikram Sambat',
    example: '2080-11-30',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly examDateBs?: string;

  @ApiPropertyOptional({
    description: 'Academic year (e.g., 2081)',
    example: '2081',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly academicYear?: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Final examination for Grade 10',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly remarks?: string;
}
