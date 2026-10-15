import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsDate,
  Matches,
  Min,
  Max,
  IsBoolean,
  IsDefined,
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
  @IsDefined()
  @IsString()
  middleNameEn: string;

  @ApiProperty({ description: 'Last name (English)', example: 'Sharma' })
  @IsNotEmpty()
  @IsString()
  lastNameEn: string;

  // === Nepali Names (Optional but recommended) ===
  @ApiProperty({ description: 'First name (Nepali)', example: 'राम' })
  @IsNotEmpty()
  @IsString()
  firstNameNp: string;

  @ApiPropertyOptional({
    description: 'Middle name (Nepali)',
    example: 'बहादुर',
  })
  @IsDefined()
  @IsString()
  middleNameNp: string;

  @ApiProperty({ description: 'Last name (Nepali)', example: 'शर्मा' })
  @IsNotEmpty()
  @IsString()
  lastNameNp: string;

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
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'BS date must be YYYY-MM-DD (e.g. 2067-02-01)',
  })
  @IsValidBsDate()
  dateOfBirthBs: string;

  // === Gender & Personal Info ===
  @ApiProperty({
    description: 'Gender',
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    example: 'MALE',
  })
  @IsNotEmpty()
  @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender: string;

  @ApiProperty({ description: 'Religion', example: 'Hinduism' })
  @IsNotEmpty()
  @IsString()
  religion: string;

  @ApiProperty({
    description: 'Religion (Nepali, provided by frontend)',
    example: 'हिन्दु धर्म',
  })
  @IsNotEmpty()
  @IsString()
  religionNp: string;

  @ApiProperty({ description: 'Nationality', example: 'Nepali' })
  @IsNotEmpty()
  @IsString()
  nationality: string;

  @ApiProperty({
    description: 'Nationality (Nepali, provided by frontend)',
    example: 'नेपाली',
  })
  @IsNotEmpty()
  @IsString()
  nationalityNp: string;

  @ApiProperty({ description: 'Mother tongue', example: 'Nepali' })
  @IsNotEmpty()
  @IsString()
  motherTongue: string;

  @ApiProperty({
    description: 'Mother tongue (Nepali, provided by frontend)',
    example: 'नेपाली',
  })
  @IsNotEmpty()
  @IsString()
  motherTongueNp: string;

  @ApiProperty({ description: 'Caste/Ethnicity', example: 'Brahmin' })
  @IsNotEmpty()
  @IsString()
  casteEthnicity: string;

  @ApiProperty({
    description: 'Caste/Ethnicity (Nepali, provided by frontend)',
    example: 'ब्राह्मण',
  })
  @IsNotEmpty()
  @IsString()
  casteEthnicityNp: string;

  @ApiProperty({ description: 'Birthplace', example: 'Kathmandu' })
  @IsNotEmpty()
  @IsString()
  birthplace: string;

  @ApiProperty({
    description: 'Birthplace (Nepali, provided by frontend)',
    example: 'काठमाडौं',
  })
  @IsNotEmpty()
  @IsString()
  birthplaceNp: string;

  @ApiProperty({ description: "Father's name", example: 'Ram Sharma' })
  @IsNotEmpty()
  @IsString()
  fatherName: string;

  @ApiPropertyOptional({
    description: "Father's phone (may be empty)",
    example: '9841000001',
  })
  @IsDefined()
  @IsString()
  fatherPhone: string;

  @ApiProperty({
    description: 'Father name (Nepali, provided by frontend)',
    example: 'राम शर्मा',
  })
  @IsNotEmpty()
  @IsString()
  fatherNameNp: string;

  @ApiProperty({ description: "Mother's name", example: 'Sita Sharma' })
  @IsNotEmpty()
  @IsString()
  motherName: string;

  @ApiPropertyOptional({
    description: "Mother's phone (may be empty)",
    example: '9841000002',
  })
  @IsDefined()
  @IsString()
  motherPhone: string;

  @ApiProperty({
    description: 'Mother name (Nepali, provided by frontend)',
    example: 'सीता शर्मा',
  })
  @IsNotEmpty()
  @IsString()
  motherNameNp: string;

  // === Permanent Address (English) - Nepal provinces 1-7 ===
  @ApiProperty({
    description: 'Permanent province ID (1-7)',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  @Max(7, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  permanentProvinceId: number;

  @ApiProperty({ description: 'Permanent district ID', example: 27 })
  @IsNotEmpty()
  @IsInt()
  permanentDistrictId: number;

  @ApiProperty({
    description: 'Permanent municipality ID',
    example: 124,
  })
  @IsNotEmpty()
  @IsInt()
  permanentMunicipalityId: number;

  @ApiProperty({ description: 'Permanent ward number', example: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(35)
  permanentWardNo: number;

  @ApiProperty({
    description: 'Permanent tole (English)',
    example: 'Baluwatar',
  })
  @IsNotEmpty()
  @IsString()
  permanentToleEn: string;

  // === Permanent Address (Nepali) ===
  @ApiProperty({
    description: 'Permanent tole (Nepali)',
    example: 'बालुवाटार',
  })
  @IsNotEmpty()
  @IsString()
  permanentToleNp: string;

  // === Temporary Address (English) - Nepal provinces 1-7 ===
  @ApiProperty({
    description: 'Temporary province ID (1-7)',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  @Max(7, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  temporaryProvinceId: number;

  @ApiProperty({ description: 'Temporary district ID', example: 27 })
  @IsNotEmpty()
  @IsInt()
  temporaryDistrictId: number;

  @ApiProperty({
    description: 'Temporary municipality ID',
    example: 124,
  })
  @IsNotEmpty()
  @IsInt()
  temporaryMunicipalityId: number;

  @ApiProperty({ description: 'Temporary ward number', example: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(35)
  temporaryWardNo: number;

  @ApiProperty({
    description: 'Temporary tole (English)',
    example: 'Baluwatar',
  })
  @IsNotEmpty()
  @IsString()
  temporaryToleEn: string;

  @ApiProperty({
    description: 'Temporary address details (English)',
    example: 'House No. 123, Street Name',
  })
  @IsNotEmpty()
  @IsString()
  temporaryAddressEn: string;

  // === Temporary Address (Nepali) ===
  @ApiProperty({
    description: 'Temporary tole (Nepali)',
    example: 'बालुवाटार',
  })
  @IsNotEmpty()
  @IsString()
  temporaryToleNp: string;

  @ApiProperty({
    description: 'Temporary address details (Nepali)',
    example: 'घर नं १२३, सडकको नाम',
  })
  @IsNotEmpty()
  @IsString()
  temporaryAddressNp: string;

  // === Contact ===
  // NOTE: students have no email/mobile of their own — contact goes
  // through guardians (guardians.mobile). No fields here by design.

  @ApiProperty({
    description: 'Blood group (may be empty if unknown)',
    example: 'A+',
  })
  @IsDefined()
  @IsString()
  bloodGroup: string;

  @ApiProperty({ description: 'Roll number', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  rollNumber: number;

  @ApiProperty({
    description: 'Profile photo URL (may be empty)',
    example: '/uploads/s1.jpg',
  })
  @IsDefined()
  @IsString()
  profilePhotoUrl: string;

  // === Admission Details ===
  @ApiProperty({ description: 'Admission date', example: '2024-04-14' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  admissionDate: Date;

  @ApiProperty({ description: 'Admission class ID', example: 5 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  admissionClassId: number;

  @ApiProperty({
    description:
      'Current class ID for placement (same as admission class for new admissions)',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  classId: number;

  @ApiProperty({
    description: 'Section ID for placement (admin-created sections)',
    example: 2,
  })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  sectionId: number;

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
  @ApiProperty({
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
  @IsNotEmpty()
  @IsEnum([
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'DROPPED',
    'GRADUATED',
    'SUSPENDED',
  ])
  currentStatus: string;

  @ApiProperty({
    description:
      'Government-mandated free seat (subject to 10% quota per school)',
    example: false,
  })
  @IsDefined()
  @IsBoolean()
  isGovtMandatedFreeSeat: boolean;

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

  @ApiProperty({ description: 'Has disability', example: false })
  @IsDefined()
  @IsBoolean()
  hasDisability: boolean;

  @ApiProperty({
    description: 'Disability type (NONE when no disability)',
    example: 'NONE',
  })
  @IsNotEmpty()
  @IsString()
  disabilityType: string;

  @ApiProperty({
    description: 'Disability type (Nepali, provided by frontend)',
    example: 'कुनै छैन',
  })
  @IsNotEmpty()
  @IsString()
  disabilityTypeNp: string;

  @ApiProperty({
    description: 'Admission date (BS) – valid YYYY-MM-DD',
    example: '2082-01-15',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'BS date must be YYYY-MM-DD' })
  @IsValidBsDate()
  admissionDateBs: string;
}
