import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsNumber,
  IsString,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReturnBookDto {
  @IsNotEmpty()
  @IsInt()
  readonly issueId: number;

  @IsOptional()
  @IsNumber()
  readonly fineAmount?: number;

  @IsOptional()
  readonly daysOverdue?: number;

  @ApiPropertyOptional({
    description: 'Return date in AD (provided by frontend)',
    example: '2024-06-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly returnDate?: Date;

  @ApiPropertyOptional({
    description: 'Return date in BS (provided by frontend)',
    example: '2081-02-19',
  })
  @IsOptional()
  @IsString()
  readonly returnDateBs?: string;

  @ApiPropertyOptional({
    description: 'Return remarks in Nepali (provided by frontend)',
    example: 'जरिवाना सहित फिर्ता',
  })
  @IsOptional()
  @IsString()
  readonly remarksNp?: string;
}
