import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCalendarEventDto {
  @ApiProperty()
  @IsNumber()
  schoolId: number;

  @ApiProperty()
  @IsString()
  academicYear: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleNp?: string;

  @ApiProperty()
  @IsString()
  eventType: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDateBs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDateBs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHoliday?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExam?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEvent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  createdBy?: number;
}
