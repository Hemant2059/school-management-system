import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Leave type name in English',
    example: 'Sick Leave',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly name: string;

  @ApiPropertyOptional({
    description: 'Leave type name in Nepali (provided by frontend)',
    example: 'बिरामी बिदा',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly nameNp?: string;

  @ApiPropertyOptional({ description: 'Max days per year', example: 12 })
  @IsOptional()
  @IsInt()
  readonly maxDaysPerYear?: number;

  @ApiPropertyOptional({ description: 'Is paid leave', example: true })
  @IsOptional()
  @IsBoolean()
  readonly isPaid?: boolean;
}
