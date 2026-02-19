import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTCDto {
  @ApiProperty()
  @IsNumber()
  schoolId: number;

  @ApiProperty()
  @IsNumber()
  studentId: number;

  @ApiProperty()
  @IsDateString()
  leavingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leavingDateBs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reasonForLeaving?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  characterGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  attendancePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lastClassId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lastSectionId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastAcademicYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isConductCertificate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty()
  @IsNumber()
  issuedBy: number;
}

export class CreateBonafideDto {
  @ApiProperty()
  @IsNumber()
  schoolId: number;

  @ApiProperty()
  @IsNumber()
  studentId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty()
  @IsNumber()
  issuedBy: number;
}

export class CreateCharacterDto {
  @ApiProperty()
  @IsNumber()
  schoolId: number;

  @ApiProperty()
  @IsNumber()
  studentId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  characterGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conductDescription?: string;

  @ApiProperty()
  @IsNumber()
  issuedBy: number;
}
