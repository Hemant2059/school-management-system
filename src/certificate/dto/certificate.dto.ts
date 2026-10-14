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

  @ApiPropertyOptional({
    description:
      'Reason for leaving in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  reasonForLeavingNp?: string;

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

  @ApiPropertyOptional({
    description: 'Issued-to in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  issuedToNp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Remarks in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  remarksNp?: string;

  @ApiPropertyOptional({
    description: 'Last class in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  lastClassNp?: string;

  @ApiPropertyOptional({
    description:
      'Certificate type in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  certificateTypeNp?: string;

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

  @ApiPropertyOptional({
    description: 'Purpose in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  purposeNp?: string;

  @ApiPropertyOptional({
    description:
      'Certificate type in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  certificateTypeNp?: string;

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

  @ApiPropertyOptional({
    description:
      'Character remarks in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  characterRemarksNp?: string;

  @ApiPropertyOptional({
    description:
      'Conduct description in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  conductDescriptionNp?: string;

  @ApiPropertyOptional({
    description:
      'Certificate type in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  certificateTypeNp?: string;

  @ApiProperty()
  @IsNumber()
  issuedBy: number;
}
