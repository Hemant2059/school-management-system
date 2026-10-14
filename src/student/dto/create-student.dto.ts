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

  @ApiPropertyOptional({
    description: 'Religion (Nepali, provided by frontend)',
    example: 'हिन्दु धर्म',
  })
  @IsOptional()
  @IsString()
  religionNp?: string;

  @ApiPropertyOptional({
    description: 'Nationality (Nepali, provided by frontend)',
    example: 'नेपाली',
  })
  @IsOptional()
  @IsString()
  nationalityNp?: string;

  @ApiPropertyOptional({ description: 'Mother tongue', example: 'Nepali' })
  @IsOptional()
  @IsString()
  motherTongue?: string;

  @ApiPropertyOptional({
    description: 'Mother tongue (Nepali, provided by frontend)',
    example: 'नेपाली',
  })
  @IsOptional()
  @IsString()
  motherTongueNp?: string;

  @ApiPropertyOptional({ description: 'Caste/Ethnicity', example: 'Brahmin' })
  @IsOptional()
  @IsString()
  casteEthnicity?: string;

  @ApiPropertyOptional({
    description: 'Caste/Ethnicity (Nepali, provided by frontend)',
    example: 'ब्राह्मण',
  })
  @IsOptional()
  @IsString()
  casteEthnicityNp?: string;

  @ApiPropertyOptional({
    description: 'Birthplace (Nepali, provided by frontend)',
    example: 'काठमाडौं',
  })
  @IsOptional()
  @IsString()
  birthplaceNp?: string;

  @ApiPropertyOptional({
    description: 'Father name (Nepali, provided by frontend)',
    example: 'राम शर्मा',
  })
  @IsOptional()
  @IsString()
  fatherNameNp?: string;

  @ApiPropertyOptional({
    description: 'Mother name (Nepali, provided by frontend)',
    example: 'सीता शर्मा',
  })
  @IsOptional()
  @IsString()
  motherNameNp?: string;

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

  // === Permanent Address (Nepali) ===
  @ApiPropertyOptional({
    description: 'Permanent tole (Nepali)',
    example: 'बालुवाटार',
  })
  @IsOptional()
  @IsString()
  permanentToleNp?: string;

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
  @ApiPropertyOptional({ description: 'Admission date', example: '2024-04-14' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  admissionDate?: Date;

  @ApiPropertyOptional({ description: 'Admission class ID', example: 5 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  admissionClassId?: number;

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

  // === CEHRD / IEMIS registry fields (writable subset) ===
  @ApiPropertyOptional({
    description: 'IEMIS permanent student ID',
    example: 'IEMIS-12345',
  })
  @IsOptional()
  @IsString()
  iemisStudentId?: string;

  @ApiPropertyOptional({ description: 'Citizenship number (16+ students)' })
  @IsOptional()
  @IsString()
  citizenshipNumber?: string;

  @ApiPropertyOptional({
    description: 'Citizenship issuing district',
    example: 'Kathmandu',
  })
  @IsOptional()
  @IsString()
  citizenshipIssueDistrict?: string;

  @ApiPropertyOptional({
    description: 'Citizenship issue date (AD)',
    example: '2024-05-15',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  citizenshipIssueDate?: Date;

  @ApiPropertyOptional({
    description: 'Citizenship issue date (BS) – valid YYYY-MM-DD',
    example: '2081-02-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'BS date must be YYYY-MM-DD (e.g. 2081-02-01)',
  })
  @IsValidBsDate()
  citizenshipIssueDateBs?: string;

  @ApiPropertyOptional({ description: 'Birth registration number' })
  @IsOptional()
  @IsString()
  birthCertificateNumber?: string;

  @ApiPropertyOptional({
    description: 'National Identity Number (Rastriya Parichaya Patra)',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiPropertyOptional({ description: 'Has disability', example: false })
  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @ApiPropertyOptional({ description: 'Disability type', example: 'Visual' })
  @IsOptional()
  @IsString()
  disabilityType?: string;

  @ApiPropertyOptional({
    description: 'Disability type (Nepali, provided by frontend)',
    example: 'दृष्टिविहीन',
  })
  @IsOptional()
  @IsString()
  disabilityTypeNp?: string;

  @ApiPropertyOptional({
    description: 'Admission date (BS) – valid YYYY-MM-DD',
    example: '2082-01-15',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'BS date must be YYYY-MM-DD' })
  @IsValidBsDate()
  admissionDateBs?: string;
}
