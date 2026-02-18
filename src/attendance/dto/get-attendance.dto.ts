import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAttendanceDto {
  @ApiPropertyOptional({ description: 'Class ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly classId?: number;

  @ApiPropertyOptional({ description: 'Section ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly sectionId?: number;

  @ApiPropertyOptional({ description: 'Student ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly studentId?: number;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiPropertyOptional({ description: 'Academic Year' })
  @IsOptional()
  @IsString()
  readonly academicYear?: string;
}
