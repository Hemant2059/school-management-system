import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { PageOptionsDto } from '../../common/dto/page-options.dto';

export class GetStudentsDto extends PageOptionsDto {
  @ApiProperty({
    description: 'School ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  readonly schoolId: number;

  @ApiPropertyOptional({ description: 'Class ID to filter by', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly classId?: number;

  @ApiPropertyOptional({ description: 'Section ID to filter by', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly sectionId?: number;

  @ApiPropertyOptional({
    description: 'Academic year to filter by',
    example: '2081-2082',
  })
  @IsOptional()
  @IsString()
  readonly academicYear?: string;

  @ApiPropertyOptional({
    description: 'Gender to filter by',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  readonly gender?: string;

  @ApiPropertyOptional({
    description: 'Student status',
    enum: ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DROPPED', 'GRADUATED'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DROPPED', 'GRADUATED'])
  readonly currentStatus?: string;
}
