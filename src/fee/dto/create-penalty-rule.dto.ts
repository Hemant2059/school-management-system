import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePenaltyRuleDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Unique rule code', example: 'LATE1' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  readonly code: string;

  @ApiProperty({ description: 'Rule name in English', example: 'Late Penalty' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  readonly nameEn: string;

  @ApiPropertyOptional({
    description: 'Rule name in Nepali (provided by frontend)',
    example: 'ढिलो जरिवाना',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly nameNp?: string;

  @ApiPropertyOptional({ description: 'Fee head ID', example: 1 })
  @IsOptional()
  @IsInt()
  readonly feeHeadId?: number;

  @ApiPropertyOptional({ description: 'Grace days before penalty', example: 5 })
  @IsOptional()
  @IsInt()
  readonly graceDays?: number;

  @ApiProperty({
    enum: ['FIXED_PER_DAY', 'PERCENT_PER_MONTH', 'FLAT'],
    example: 'FLAT',
  })
  @IsNotEmpty()
  @IsIn(['FIXED_PER_DAY', 'PERCENT_PER_MONTH', 'FLAT'])
  readonly mode: 'FIXED_PER_DAY' | 'PERCENT_PER_MONTH' | 'FLAT';

  @ApiPropertyOptional({ description: 'Flat amount', example: 50 })
  @IsOptional()
  @IsNumber()
  readonly amount?: number;

  @ApiPropertyOptional({ description: 'Percent (0-100)', example: 0 })
  @IsOptional()
  @IsNumber()
  readonly percent?: number;

  @ApiPropertyOptional({ description: 'Maximum cap', example: 1000 })
  @IsOptional()
  @IsNumber()
  readonly maxCap?: number;
}
