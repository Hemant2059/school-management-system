import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsDate,
  IsEmail,
  Matches,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsValidBsDate } from '../../common/validators/bs-date.validator';

export class CreateStudentDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  schoolId: number;

  @ApiProperty({ description: 'Admission number', example: 'ADM-2024-001' })
  @IsNotEmpty()
  @IsString()
  admissionNumber: string;

  @ApiPropertyOptional({ description: 'Roll number', example: '10A-01' })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional({
    description: 'Registration number',
    example: 'REG-2024-998',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  // === English Names ===
  @ApiProperty({ description: 'First name (English)', example: 'Ram' })
  @IsNotEmpty()
  @IsString()
  firstNameEn: string;

  @ApiPropertyOptional({
    description: 'Middle name (English)',
    example: 'Bahadur',
  })
  @IsOptional()
  @IsString()
  middleNameEn?: string;

  @ApiProperty({ description: 'Last name (English)', example: 'Sharma' })
  @IsNotEmpty()
  @IsString()
  lastNameEn: string;

  // === Nepali Names (Optional but recommended) ===
  @ApiPropertyOptional({ description: 'First name (Nepali)', example: 'राम' })
  @IsOptional()
  @IsString()
  firstNameNp?: string;

  @ApiPropertyOptional({
    description: 'Middle name (Nepali)',
    example: 'बहादुर',
  })
  @IsOptional()
  @IsString()
  middleNameNp?: string;

  @ApiPropertyOptional({ description: 'Last name (Nepali)', example: 'शर्मा' })
  @IsOptional()
  @IsString()
  lastNameNp?: string;

  // === Date of Birth ===
  @ApiProperty({ description: 'Date of birth (AD)', example: '2010-05-15' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dateOfBirthAd: Date;

  @ApiPropertyOptional({
    description: 'Date of birth (BS) – valid YYYY-MM-DD',
    example: '2067-02-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'BS date must be YYYY-MM-DD (e.g. 2067-02-01)',
  })
  @IsValidBsDate()
  dateOfBirthBs?: string;

  // === Gender & Personal Info ===
  @ApiProperty({
    description: 'Gender',
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    example: 'MALE',
  })
  @IsNotEmpty()
  @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender: string;

  @ApiPropertyOptional({ description: 'Blood group', example: 'A+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ description: 'Religion', example: 'Hinduism' })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional({ description: 'Mother tongue', example: 'Nepali' })
  @IsOptional()
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional({ description: 'Caste/Ethnicity', example: 'Brahmin' })
  @IsOptional()
  @IsString()
  casteEthnicity?: string;

  // === Permanent Address (English) - Nepal provinces 1-7 ===
  @ApiPropertyOptional({
    description: 'Permanent province ID (1-7)',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  @Max(7, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  permanentProvinceId?: number;

  @ApiPropertyOptional({ description: 'Permanent district ID', example: 27 })
  @IsOptional()
  @IsInt()
  permanentDistrictId?: number;

  @ApiPropertyOptional({
    description: 'Permanent municipality ID',
    example: 124,
  })
  @IsOptional()
  @IsInt()
  permanentMunicipalityId?: number;

  @ApiPropertyOptional({ description: 'Permanent ward number', example: 5 })
  @IsOptional()
  @IsInt()
  permanentWardNo?: number;

  @ApiPropertyOptional({
    description: 'Permanent tole (English)',
    example: 'Baluwatar',
  })
  @IsOptional()
  @IsString()
  permanentToleEn?: string;

  @ApiPropertyOptional({
    description: 'Permanent address details (English)',
    example: 'House No. 123, Street Name',
  })
  @IsOptional()
  @IsString()
  permanentAddressEn?: string;

  // === Permanent Address (Nepali) ===
  @ApiPropertyOptional({
    description: 'Permanent tole (Nepali)',
    example: 'बालुवाटार',
  })
  @IsOptional()
  @IsString()
  permanentToleNp?: string;

  @ApiPropertyOptional({
    description: 'Permanent address details (Nepali)',
    example: 'घर नं १२३, सडकको नाम',
  })
  @IsOptional()
  @IsString()
  permanentAddressNp?: string;

  // === Temporary Address (English) - Nepal provinces 1-7 ===
  @ApiPropertyOptional({
    description: 'Temporary province ID (1-7)',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  @Max(7, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  temporaryProvinceId?: number;

  @ApiPropertyOptional({ description: 'Temporary district ID', example: 27 })
  @IsOptional()
  @IsInt()
  temporaryDistrictId?: number;

  @ApiPropertyOptional({
    description: 'Temporary municipality ID',
    example: 124,
  })
  @IsOptional()
  @IsInt()
  temporaryMunicipalityId?: number;

  @ApiPropertyOptional({ description: 'Temporary ward number', example: 5 })
  @IsOptional()
  @IsInt()
  temporaryWardNo?: number;

  @ApiPropertyOptional({
    description: 'Temporary tole (English)',
    example: 'Baluwatar',
  })
  @IsOptional()
  @IsString()
  temporaryToleEn?: string;

  @ApiPropertyOptional({
    description: 'Temporary address details (English)',
    example: 'House No. 123, Street Name',
  })
  @IsOptional()
  @IsString()
  temporaryAddressEn?: string;

  // === Temporary Address (Nepali) ===
  @ApiPropertyOptional({
    description: 'Temporary tole (Nepali)',
    example: 'बालुवाटार',
  })
  @IsOptional()
  @IsString()
  temporaryToleNp?: string;

  @ApiPropertyOptional({
    description: 'Temporary address details (Nepali)',
    example: 'घर नं १२३, सडकको नाम',
  })
  @IsOptional()
  @IsString()
  temporaryAddressNp?: string;

  // === Contact ===
  @ApiPropertyOptional({
    description: 'Student mobile number',
    example: '9841234567',
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  studentMobile?: string;

  @ApiPropertyOptional({
    description: 'Student email address',
    example: 'student@example.com',
  })
  @IsOptional()
  @IsEmail()
  studentEmail?: string;

  // === Admission Details ===
  @ApiProperty({ description: 'Admission date', example: '2024-04-14' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  admissionDate: Date;

  @ApiProperty({ description: 'Admission class ID', example: 5 })
  @IsNotEmpty()
  @IsInt()
  admissionClassId: number;

  @ApiPropertyOptional({
    description: 'Previous school name',
    example: 'ABC Primary School',
  })
  @IsOptional()
  @IsString()
  previousSchoolName?: string;

  @ApiPropertyOptional({
    description: 'Previous school address',
    example: 'Kathmandu, Nepal',
  })
  @IsOptional()
  @IsString()
  previousSchoolAddress?: string;

  @ApiPropertyOptional({
    description: 'Transfer certificate number',
    example: 'TC-12345',
  })
  @IsOptional()
  @IsString()
  transferCertificateNumber?: string;

  @ApiPropertyOptional({ description: 'TC issue date', example: '2024-03-25' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  tcIssueDate?: Date;

  // === Status ===
  @ApiPropertyOptional({
    description: 'Student current status',
    enum: [
      'ACTIVE',
      'INACTIVE',
      'TRANSFERRED',
      'DROPPED',
      'GRADUATED',
      'SUSPENDED',
    ],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum([
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'DROPPED',
    'GRADUATED',
    'SUSPENDED',
  ])
  currentStatus?: string;

  @ApiPropertyOptional({
    description:
      'Government-mandated free seat (subject to 10% quota per school)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isGovtMandatedFreeSeat?: boolean;
}
