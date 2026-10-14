import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  IsDate,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiscountRuleDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Unique rule code', example: 'SIB10' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  readonly code: string;

  @ApiProperty({
    description: 'Rule name in English',
    example: 'Sibling Discount',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  readonly nameEn: string;

  @ApiPropertyOptional({
    description: 'Rule name in Nepali (provided by frontend)',
    example: 'दाजुभाइ छुट',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  readonly nameNp?: string;

  @ApiProperty({ enum: ['PERCENT', 'FIXED'], example: 'PERCENT' })
  @IsNotEmpty()
  @IsIn(['PERCENT', 'FIXED'])
  readonly discountType: 'PERCENT' | 'FIXED';

  @ApiProperty({
    description: 'Discount value (percent or flat NPR)',
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly value: number;

  @ApiPropertyOptional({ description: 'Applies to', example: 'ALL' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly appliesTo?: string;

  @ApiPropertyOptional({ description: 'Minimum siblings required', example: 2 })
  @IsOptional()
  @IsInt()
  readonly minSiblings?: number;

  @ApiPropertyOptional({
    description: 'Valid from (AD)',
    example: '2025-04-14',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly validFromAd?: Date;

  @ApiPropertyOptional({ description: 'Valid to (AD)', example: '2026-04-13' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly validToAd?: Date;

  @ApiPropertyOptional({
    description: 'Valid from (BS, provided by frontend)',
    example: '2082-01-01',
  })
  @IsOptional()
  @IsString()
  readonly validFromBs?: string;

  @ApiPropertyOptional({
    description: 'Valid to (BS, provided by frontend)',
    example: '2082-12-30',
  })
  @IsOptional()
  @IsString()
  readonly validToBs?: string;

  @ApiPropertyOptional({
    description: 'Can stack with other rules',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  readonly isStackable?: boolean;
}
