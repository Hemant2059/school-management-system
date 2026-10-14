import { IsNotEmpty, IsInt, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignStudentDto {
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Route ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly routeId: number;

  @ApiProperty({ description: 'Stop ID', example: 5 })
  @IsNotEmpty()
  @IsInt()
  readonly stopId: number;

  @ApiProperty({ description: 'Vehicle ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly vehicleId: number;

  @ApiProperty({ description: 'Assignment date', example: '2024-04-14' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly assignmentDate: Date;

  @ApiPropertyOptional({
    description: 'Assignment date in BS (provided by frontend)',
    example: '2081-01-01',
  })
  @IsOptional()
  @IsString()
  readonly assignmentDateBs?: string;
}
