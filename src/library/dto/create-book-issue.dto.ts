import { IsNotEmpty, IsInt, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookIssueDto {
  @IsNotEmpty()
  @IsInt()
  readonly bookId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Student ID', example: 101 })
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiPropertyOptional({ description: 'Teacher ID (optional)', example: 5 })
  @IsOptional()
  @IsInt()
  readonly teacherId?: number;

  @ApiProperty({ description: 'Date of issue', example: '2024-05-15' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly issueDate: Date;

  @ApiProperty({ description: 'Due date for return', example: '2024-05-29' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly dueDate: Date;
}
