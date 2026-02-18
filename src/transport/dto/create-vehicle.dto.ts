import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  readonly vehicleNumber: string;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Vehicle name', example: 'Tata Marcopolo' })
  @IsNotEmpty()
  @IsString()
  readonly vehicleName: string;

  @ApiProperty({ description: 'Vehicle type', example: 'BUS' })
  @IsNotEmpty()
  @IsString()
  readonly vehicleType: string;

  @ApiProperty({ description: 'Passenger capacity', example: 40 })
  @IsNotEmpty()
  @IsInt()
  readonly capacity: number;

  @ApiPropertyOptional({ description: 'Manufacturer', example: 'Tata Motors' })
  @IsOptional()
  @IsString()
  readonly manufacturer?: string;

  @ApiPropertyOptional({ description: 'Year of manufacture', example: 2022 })
  @IsOptional()
  @IsInt()
  readonly year?: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'Yellow' })
  @IsOptional()
  @IsString()
  readonly color?: string;

  @ApiPropertyOptional({
    description: 'Chassis number',
    example: 'CH123456789',
  })
  @IsOptional()
  @IsString()
  readonly chassisNumber?: string;

  @ApiPropertyOptional({ description: 'Engine number', example: 'EN123456789' })
  @IsOptional()
  @IsString()
  readonly engineNumber?: string;

  @ApiPropertyOptional({
    description: 'Insurance expiry date',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly insuranceExpiry?: Date;

  @ApiPropertyOptional({
    description: 'Permit expiry date',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly permitExpiry?: Date;
}
