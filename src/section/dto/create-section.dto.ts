import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Academic class ID',
    example: 5,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly classId: number;

  @ApiProperty({
    description: 'Section name (e.g., "A", "B", "Rose", "Lily")',
    example: 'A',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly sectionName: string;

  @ApiProperty({
    description: 'Short section code',
    example: 'SEC-A',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly sectionCode: string;

  @ApiPropertyOptional({
    description: 'Display order of section',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly sectionOrder?: number;

  @ApiPropertyOptional({
    description: 'Maximum student capacity',
    example: 40,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly capacity?: number;
}
