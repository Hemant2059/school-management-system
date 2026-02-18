import { PartialType } from '@nestjs/swagger';
import { CreateEnrollmentDto } from './create-enrollment.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Extend with isCurrent property
export class UpdateEnrollmentDto extends PartialType(CreateEnrollmentDto) {
  @ApiPropertyOptional({ description: 'Is current enrollment?', example: true })
  @IsOptional()
  @IsBoolean()
  readonly isCurrent?: boolean;
}
