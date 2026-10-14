import { IsNotEmpty, IsInt, IsDate, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsInt()
  readonly staffId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Leave Type ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly leaveTypeId: number;

  @ApiProperty({ description: 'Start date of leave', example: '2024-05-10' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly startDate: Date;

  @ApiProperty({ description: 'End date of leave', example: '2024-05-12' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly endDate: Date;

  @ApiProperty({
    description: 'Start date of leave in BS (provided by frontend)',
    example: '2081-01-28',
  })
  @IsOptional()
  @IsString()
  readonly startDateBs?: string;

  @ApiProperty({
    description: 'End date of leave in BS (provided by frontend)',
    example: '2081-01-30',
  })
  @IsOptional()
  @IsString()
  readonly endDateBs?: string;

  @ApiProperty({
    description: 'Number of days requested',
    example: 3,
    minimum: 1,
  })
  @IsNotEmpty()
  @Min(1)
  readonly daysRequested: number;

  @ApiProperty({
    description: 'Reason for leave',
    example: 'Medical emergency',
  })
  @IsNotEmpty()
  @IsString()
  readonly reason: string;

  @ApiPropertyOptional({
    description: 'Reason for leave in Nepali (provided by frontend)',
    example: 'चिकित्सा आकस्मिक',
  })
  @IsOptional()
  @IsString()
  readonly reasonNp?: string;
}
