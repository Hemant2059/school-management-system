import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteDto {
  @IsNotEmpty()
  @IsString()
  readonly routeName: string;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Route code', example: 'R-KTM-01' })
  @IsNotEmpty()
  @IsString()
  readonly routeCode: string;

  @ApiPropertyOptional({ description: 'Province ID', example: 3 })
  @IsOptional()
  @IsInt()
  readonly provinceId?: number;

  @ApiPropertyOptional({ description: 'District ID', example: 27 })
  @IsOptional()
  @IsInt()
  readonly districtId?: number;

  @ApiPropertyOptional({ description: 'Municipality ID', example: 124 })
  @IsOptional()
  @IsInt()
  readonly municipalityId?: number;

  @ApiProperty({
    description: 'Detailed route description',
    example: 'Starting from Ratnapark, via Thapathali to Satdobato',
  })
  @IsNotEmpty()
  @IsString()
  readonly routeDescription: string;

  @ApiProperty({ description: 'Total distance in kilometers', example: 8.5 })
  @IsNotEmpty()
  @IsNumber()
  readonly distanceKm: number;

  @ApiPropertyOptional({
    description: 'Estimated travel time',
    example: '45 mins',
  })
  @IsOptional()
  @IsString()
  readonly estimatedTime?: string;
}
