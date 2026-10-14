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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty({
    description: 'Official name of the school in English',
    example: 'Everest Higher Secondary School',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  schoolName: string;

  @ApiProperty({
    description: 'Unique identification code for the school',
    example: 'SCH-001',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  schoolCode: string;

  @ApiPropertyOptional({
    description: 'School name in Nepali (Devanagari script)',
    example: 'एभरेस्ट उच्च माध्यमिक विद्यालय',
    type: String,
  })
  @IsOptional()
  @IsString()
  schoolNameNepali?: string;

  @ApiPropertyOptional({
    description: 'Type of school based on boarding arrangement',
    example: 'DAY_BOARDING',
    enum: ['DAY', 'BOARDING', 'DAY_BOARDING'],
  })
  @IsOptional()
  @IsEnum(['DAY', 'BOARDING', 'DAY_BOARDING'])
  schoolType?: string;

  @ApiPropertyOptional({
    description: 'Type of school (Nepali, provided by frontend)',
    example: 'दिवा आवासीय',
    type: String,
  })
  @IsOptional()
  @IsString()
  schoolTypeNp?: string;

  @ApiPropertyOptional({
    description: 'Ownership/management type of the school',
    example: 'PRIVATE',
    enum: ['PRIVATE', 'COMMUNITY', 'INSTITUTIONAL'],
  })
  @IsOptional()
  @IsEnum(['PRIVATE', 'COMMUNITY', 'INSTITUTIONAL'])
  ownershipType?: string;

  @ApiPropertyOptional({
    description: 'Ownership/management type (Nepali, provided by frontend)',
    example: 'निजी',
    type: String,
  })
  @IsOptional()
  @IsString()
  ownershipTypeNp?: string;

  @ApiPropertyOptional({
    description: 'School name (Nepali twin of legacy name column, provided by frontend)',
    example: 'एभरेस्ट उच्च माध्यमिक विद्यालय',
    type: String,
  })
  @IsOptional()
  @IsString()
  nameNp?: string;

  @ApiPropertyOptional({
    description: 'School address (Nepali, provided by frontend)',
    example: 'काठमाडौं, नेपाल',
    type: String,
  })
  @IsOptional()
  @IsString()
  addressNp?: string;

  @ApiPropertyOptional({
    description: 'Date when the school was established',
    example: '2000-04-15T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  establishedDate?: Date;

  @ApiPropertyOptional({
    description:
      'Date when the school was established in BS format (YYYY-MM-DD)',
    example: '2057-01-01',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  establishedDateBs?: string;

  @ApiPropertyOptional({
    description: 'Government registration number',
    example: 'REG-2000-KTM-001',
    type: String,
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: 'Educational board affiliation number (e.g., NEB, CBSE)',
    example: 'NEB-2000-001',
    type: String,
  })
  @IsOptional()
  @IsString()
  affiliationNumber?: string;

  // Nepal Address
  @ApiPropertyOptional({
    description: 'Province ID (1-7 for Nepal provinces)',
    example: 3,
    type: Number,
    minimum: 1,
    maximum: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  @Max(7, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  provinceId?: number;

  @ApiPropertyOptional({
    description: 'District ID from the Nepal districts database',
    example: 27,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  districtId?: number;

  @ApiPropertyOptional({
    description: 'Municipality/Rural Municipality ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  municipalityId?: number;

  @ApiPropertyOptional({
    description: 'Ward number within the municipality',
    example: 5,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  wardNo?: number;

  @ApiPropertyOptional({
    description: 'Tole (locality/neighborhood) name in English',
    example: 'Dillibazar',
    type: String,
  })
  @IsOptional()
  @IsString()
  tole?: string;

  @ApiPropertyOptional({
    description: 'Tole name in Nepali (Devanagari script)',
    example: 'दिल्लीबजार',
    type: String,
  })
  @IsOptional()
  @IsString()
  toleNepali?: string;

  @ApiPropertyOptional({
    description: 'Detailed street address in English',
    example: 'Near Bhrikuti Mandap',
    type: String,
  })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional({
    description: 'Street address in Nepali (Devanagari script)',
    example: 'भृकुटी मण्डप नजिक',
    type: String,
  })
  @IsOptional()
  @IsString()
  streetAddressNepali?: string;

  // Contact - Nepal phone validation
  @ApiPropertyOptional({
    description:
      'Primary mobile number (Nepali format: 10 digits starting with 98, 97, or 96)',
    example: '9841234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  mobile?: string;

  @ApiPropertyOptional({
    description: 'Landline phone number',
    example: '01-4123456',
    type: String,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Primary email address for school contact',
    example: 'info@everestschool.edu.np',
    type: String,
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Settings
  @ApiPropertyOptional({
    description: 'Month when academic year starts (1-12)',
    example: 4,
    type: Number,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  academicYearStartMonth?: number;

  @ApiPropertyOptional({
    description: 'Currency code used by the school (ISO 4217)',
    example: 'NPR',
    type: String,
  })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Timezone identifier (IANA timezone database)',
    example: 'Asia/Kathmandu',
    type: String,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Preferred language for system interface',
    example: 'BOTH',
    enum: ['EN', 'NE', 'BOTH'],
  })
  @IsOptional()
  @IsEnum(['EN', 'NE', 'BOTH'])
  languagePreference?: string;
}
