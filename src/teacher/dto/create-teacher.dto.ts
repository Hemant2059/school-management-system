import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsEmail,
  Matches,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'Unique employee identification number',
    example: 'EMP-2024-001',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly employeeId: string;

  @ApiProperty({
    description: 'ID of the school this teacher belongs to',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @Type(() => Number)
  readonly schoolId: number;

  @ApiPropertyOptional({
    description: 'Linked login user ID (enables teacher-scoped data access)',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  readonly userId?: number;

  // === Names (Bilingual) ===
  @ApiProperty({
    description: 'Teacher first name in English',
    example: 'Sita',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly firstNameEn: string;

  @ApiPropertyOptional({
    description: 'Teacher middle name in English',
    example: 'Maya',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly middleNameEn?: string;

  @ApiProperty({
    description: 'Teacher last name in English',
    example: 'Sharma',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly lastNameEn: string;

  @ApiPropertyOptional({
    description: 'Teacher first name in Nepali (Devanagari)',
    example: 'सीता',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly firstNameNp?: string;

  @ApiPropertyOptional({
    description: 'Teacher middle name in Nepali (Devanagari)',
    example: 'माया',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly middleNameNp?: string;

  @ApiPropertyOptional({
    description: 'Teacher last name in Nepali (Devanagari)',
    example: 'शर्मा',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly lastNameNp?: string;

  // === Personal Info ===
  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1985-05-15T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly dateOfBirth?: Date;

  @ApiProperty({
    description: 'Gender',
    example: 'FEMALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsNotEmpty()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  readonly gender: string;

  @ApiPropertyOptional({
    description: 'Blood group',
    example: 'O+',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly bloodGroup?: string;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'Nepali',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly nationality?: string;

  @ApiPropertyOptional({
    description: 'Nationality (Nepali, provided by frontend)',
    example: 'नेपाली',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly nationalityNp?: string;

  @ApiPropertyOptional({
    description: 'Religion',
    example: 'Hindu',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly religion?: string;

  @ApiPropertyOptional({
    description: 'Religion (Nepali, provided by frontend)',
    example: 'हिन्दु',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly religionNp?: string;

  @ApiPropertyOptional({
    description: 'Caste/ethnicity name (Nepali, provided by frontend)',
    example: 'ब्राह्मण',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly casteEthnicityNameNp?: string;

  @ApiPropertyOptional({
    description: 'Marital status (Nepali, provided by frontend)',
    example: 'विवाहित',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly maritalStatusNp?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact relation (Nepali, provided by frontend)',
    example: 'श्रीमान',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly emergencyContactRelationNp?: string;

  // === Qualifications ===
  @ApiPropertyOptional({
    description: 'Highest educational qualification',
    example: 'Masters in Education (M.Ed)',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly highestQualification?: string;

  @ApiPropertyOptional({
    description: 'Highest educational qualification (Nepali, provided by frontend)',
    example: 'शिक्षामा स्नातकोत्तर',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly highestQualificationNp?: string;

  @ApiPropertyOptional({
    description: 'Subject specialization',
    example: 'Mathematics',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly specialization?: string;

  @ApiPropertyOptional({
    description: 'Subject specialization (Nepali, provided by frontend)',
    example: 'गणित',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly specializationNp?: string;

  @ApiPropertyOptional({
    description: 'University or board name',
    example: 'Tribhuvan University',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly universityBoard?: string;

  @ApiPropertyOptional({
    description: 'University or board name (Nepali, provided by frontend)',
    example: 'त्रिभुवन विश्वविद्यालय',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly universityBoardNp?: string;

  @ApiPropertyOptional({
    description: 'Year of passing/completing degree',
    example: 2010,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly passingYear?: number;

  @ApiPropertyOptional({
    description: 'Teaching license/certification number',
    example: 'TL-2010-12345',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly teachingLicenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Teaching license expiry date',
    example: '2026-12-31T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly licenseExpiryDate?: Date;

  // === Contact ===
  @ApiPropertyOptional({
    description: 'Personal mobile number (Nepali format)',
    example: '9841234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  readonly personalMobile?: string;

  @ApiPropertyOptional({
    description: 'Official/school-provided mobile number',
    example: '9851234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  readonly officialMobile?: string;

  @ApiPropertyOptional({
    description: 'Personal email address',
    example: 'sita.sharma@gmail.com',
    type: String,
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  readonly personalEmail?: string;

  @ApiPropertyOptional({
    description: 'Official school email address',
    example: 'sita.sharma@school.edu.np',
    type: String,
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  readonly officialEmail?: string;

  // === Employment ===
  @ApiProperty({
    description: 'Date of joining the school',
    example: '2015-04-15T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly joiningDate: Date;

  @ApiPropertyOptional({
    description: 'Type of employment contract',
    example: 'PERMANENT',
    enum: ['PERMANENT', 'CONTRACTUAL', 'PART_TIME', 'ADJUNCT'],
  })
  @IsOptional()
  @IsEnum(['PERMANENT', 'CONTRACTUAL', 'PART_TIME', 'ADJUNCT'])
  readonly employmentType?: string;

  @ApiPropertyOptional({
    description: 'Type of employment contract (Nepali, provided by frontend)',
    example: 'स्थायी',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly employmentTypeNp?: string;

  @ApiPropertyOptional({
    description: 'Designation (Nepali, provided by frontend)',
    example: 'प्रधानाध्यापक',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly designationNp?: string;

  @ApiPropertyOptional({
    description: 'Department or subject group',
    example: 'Mathematics Department',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly department?: string;

  @ApiPropertyOptional({
    description: 'Department or subject group (Nepali, provided by frontend)',
    example: 'गणित विभाग',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly departmentNp?: string;

  // === Status ===
  @ApiPropertyOptional({
    description: 'Current employment status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'])
  readonly currentStatus?: string;
}
