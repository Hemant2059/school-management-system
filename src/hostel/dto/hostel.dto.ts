import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHostelDto {
  @ApiProperty({ description: 'Hostel name', example: 'Boys Hostel' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Hostel name in Nepali (provided by frontend)',
    example: 'छात्रावास',
  })
  @IsOptional()
  @IsString()
  nameNp?: string;

  @ApiProperty({ enum: ['boys', 'girls', 'mixed'], example: 'boys' })
  @IsEnum(['boys', 'girls', 'mixed'])
  type: 'boys' | 'girls' | 'mixed';

  @ApiProperty({ description: 'Total number of beds', example: 100 })
  @IsNotEmpty()
  @IsInt()
  totalBeds: number;

  @ApiPropertyOptional({
    description: 'Hostel address',
    example: 'School Campus',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Hostel address in Nepali (provided by frontend)',
    example: 'विद्यालय परिसर',
  })
  @IsOptional()
  @IsString()
  addressNp?: string;

  @ApiPropertyOptional({
    description: 'Warden name',
    example: 'Kedar Nath',
  })
  @IsOptional()
  @IsString()
  wardenName?: string;

  @ApiPropertyOptional({
    description: 'Warden name in Nepali (provided by frontend)',
    example: 'वार्डेन नाम',
  })
  @IsOptional()
  @IsString()
  wardenNameNp?: string;

  @ApiPropertyOptional({ description: 'Ward number', example: 1 })
  @IsOptional()
  @IsInt()
  wardNumber?: number;

  @ApiPropertyOptional({ description: 'School ID', example: 1 })
  @IsOptional()
  @IsInt()
  schoolId?: number;
}

export class CreateRoomDto {
  @ApiProperty({ description: 'Hostel ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  hostelId: number;

  @ApiProperty({ description: 'Room number', example: '101' })
  @IsNotEmpty()
  @IsString()
  roomNumber: string;

  @ApiProperty({ description: 'Floor number', example: 1 })
  @IsNotEmpty()
  @IsInt()
  floor: number;

  @ApiProperty({ description: 'Total beds in room', example: 4 })
  @IsNotEmpty()
  @IsInt()
  totalBeds: number;

  @ApiProperty({
    enum: ['single', 'double', 'triple', 'dormitory'],
    example: 'dormitory',
  })
  @IsEnum(['single', 'double', 'triple', 'dormitory'])
  roomType: 'single' | 'double' | 'triple' | 'dormitory';

  @ApiPropertyOptional({
    description: 'Room type in Nepali (provided by frontend)',
    example: 'छात्रावास कोठा',
  })
  @IsOptional()
  @IsString()
  roomTypeNp?: string;

  @ApiProperty({ description: 'Monthly rent', example: 2000 })
  @IsNotEmpty()
  @IsNumber()
  monthlyRent: number;

  @ApiPropertyOptional({ description: 'School ID', example: 1 })
  @IsOptional()
  @IsInt()
  schoolId?: number;
}

export class AssignStudentDto {
  @ApiProperty({ description: 'Hostel ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  hostelId: number;

  @ApiProperty({ description: 'Room ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  roomId: number;

  @ApiProperty({ description: 'Student ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @ApiProperty({ description: 'Bed number', example: 'A1' })
  @IsNotEmpty()
  @IsString()
  bedNumber: string;

  @ApiProperty({ description: 'Check-in date (AD)', example: '2026-02-20' })
  @IsNotEmpty()
  @IsString()
  checkInDate: string;

  @ApiProperty({ description: 'Check-in date (BS)', example: '2082-11-08' })
  @IsNotEmpty()
  @IsString()
  checkInDateBs: string;

  @ApiPropertyOptional({ description: 'School ID', example: 1 })
  @IsOptional()
  @IsInt()
  schoolId?: number;
}

export class UpdateHostelDto {
  @ApiPropertyOptional({
    description: 'Hostel name',
    example: 'Updated Hostel',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Hostel name in Nepali (provided by frontend)',
  })
  @IsOptional()
  @IsString()
  nameNp?: string;

  @ApiPropertyOptional({ enum: ['boys', 'girls', 'mixed'], example: 'boys' })
  @IsOptional()
  @IsEnum(['boys', 'girls', 'mixed'])
  type?: 'boys' | 'girls' | 'mixed';

  @ApiPropertyOptional({ description: 'Total beds', example: 80 })
  @IsOptional()
  @IsInt()
  totalBeds?: number;

  @ApiPropertyOptional({ description: 'Available beds', example: 50 })
  @IsOptional()
  @IsInt()
  availableBeds?: number;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Hostel address in Nepali (provided by frontend)',
  })
  @IsOptional()
  @IsString()
  addressNp?: string;

  @ApiPropertyOptional({
    description: 'Warden name in Nepali (provided by frontend)',
  })
  @IsOptional()
  @IsString()
  wardenNameNp?: string;

  @ApiPropertyOptional({ description: 'Ward number' })
  @IsOptional()
  @IsInt()
  wardNumber?: number;
}
