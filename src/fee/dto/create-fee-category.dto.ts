import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeCategoryDto {
  @ApiProperty({
    description: 'Name of the fee category',
    example: 'Tuition Fee',
  })
  @IsNotEmpty()
  @IsString()
  readonly categoryName: string;

  @ApiProperty({
    description: 'ID of the school this category belongs to',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  readonly schoolId: number;

  @ApiProperty({ description: 'Unique code for the category', example: 'TUIT' })
  @IsNotEmpty()
  @IsString()
  readonly categoryCode: string;

  @ApiProperty({
    description: 'General type/classification of the fee',
    enum: [
      'TUITION',
      'ADMISSION',
      'EXAMINATION',
      'TRANSPORT',
      'HOSTEL',
      'MISC',
      'FINE',
      'LIBRARY',
      'SPORTS',
      'LAB',
    ],
  })
  @IsNotEmpty()
  @IsEnum([
    'TUITION',
    'ADMISSION',
    'EXAMINATION',
    'TRANSPORT',
    'HOSTEL',
    'MISC',
    'FINE',
    'LIBRARY',
    'SPORTS',
    'LAB',
  ])
  readonly categoryType: string;

  @ApiPropertyOptional({ description: 'Description of the fee category' })
  @IsOptional()
  @IsString()
  readonly description?: string;
}
