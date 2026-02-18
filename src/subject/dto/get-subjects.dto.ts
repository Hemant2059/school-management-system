import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSubjectsDto {
  @ApiPropertyOptional({
    description: 'Subject group',
    enum: ['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'])
  readonly subjectGroup?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search term (name or code)' })
  @IsOptional()
  @IsString()
  readonly search?: string;
}
