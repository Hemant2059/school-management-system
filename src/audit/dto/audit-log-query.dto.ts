import { IsOptional, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  schoolId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  userId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  entityId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  limit?: number;
}
