import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeCategoryDto {
  @ApiProperty({
    description: 'ID of the school this category belongs to',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  readonly schoolId: number;

  @ApiProperty({
    description: 'Name of the fee category',
    example: 'Tuition Fee',
  })
  @IsNotEmpty()
  @IsString()
  readonly categoryName: string;

  @ApiPropertyOptional({ description: 'Description of the fee category' })
  @IsOptional()
  @IsString()
  readonly description?: string;
}
