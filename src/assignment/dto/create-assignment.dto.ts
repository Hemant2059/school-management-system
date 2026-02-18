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
  @ApiProperty({
    description: 'Assignment title',
    example: 'Quadratic Equations Chapter Exercise',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty({
    description: 'Detailed assignment description or instructions',
    example: 'Complete all exercises from chapter 5 on quadratic equations',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly description: string;

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
