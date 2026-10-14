import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsDate,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiPropertyOptional({
    description: 'Assignment title',
    example: 'Quadratic Equations Chapter Exercise',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly title?: string;

  @ApiPropertyOptional({
    description: 'Assignment title in Nepali (provided by frontend)',
    example: 'गृहकार्य',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly titleNp?: string;

  @ApiProperty({
    description: 'Detailed assignment description or instructions',
    example: 'Complete all exercises from chapter 5 on quadratic equations',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @ApiPropertyOptional({
    description: 'Assignment description in Nepali (provided by frontend)',
    example: 'विवरण',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly descriptionNp?: string;

  @ApiProperty({
    description: 'Academic class ID',
    example: 10,
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
    description: 'Teacher ID who assigned the work',
    example: 3,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly teacherId: number;

  @ApiProperty({
    description: 'Assignment submission due date',
    example: '2024-03-01T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly dueDate: Date;

  @ApiPropertyOptional({
    description: 'Due date in BS (provided by frontend)',
    example: '2081-11-18',
  })
  @IsOptional()
  @IsString()
  readonly dueDateBs?: string;

  @ApiPropertyOptional({
    description: 'Total marks for the assignment',
    example: 20,
    type: Number,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  readonly totalMarks?: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;
}
