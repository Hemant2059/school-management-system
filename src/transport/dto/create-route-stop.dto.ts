import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRouteStopDto {
  @IsNotEmpty()
  @IsInt()
  readonly routeId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Stop name', example: 'Baluwatar Chowk' })
  @IsNotEmpty()
  @IsString()
  readonly stopName: string;

  @ApiPropertyOptional({
    description: 'Stop name in Nepali',
    example: 'बालुवाटार चोक',
  })
  @IsOptional()
  @IsString()
  readonly stopNameNp?: string;

  @ApiProperty({ description: 'Sequence number of the stop', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly stopOrder: number;

  @ApiPropertyOptional({ description: 'Latitude', example: 27.7123 })
  @IsOptional()
  @IsNumber()
  readonly latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 85.3245 })
  @IsOptional()
  @IsNumber()
  readonly longitude?: number;

  @ApiPropertyOptional({
    description: 'Estimated arrival time',
    example: '10:15:00',
  })
  @IsOptional()
  @IsString()
  readonly arrivalTime?: string;

  @ApiPropertyOptional({
    description: 'Estimated departure time',
    example: '10:20:00',
  })
  @IsOptional()
  @IsString()
  readonly departureTime?: string;
}
