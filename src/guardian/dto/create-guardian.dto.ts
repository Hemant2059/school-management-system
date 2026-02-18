import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsEmail,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGuardianDto {
  // === Names (Bilingual) ===
  @ApiProperty({
    description: 'Guardian first name in English',
    example: 'Ram',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly firstNameEn: string;

  @ApiProperty({
    description: 'ID of the school this guardian belongs to',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly schoolId: number;

  @ApiPropertyOptional({
    description: 'Guardian middle name in English',
    example: 'Bahadur',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly middleNameEn?: string;

  @ApiProperty({
    description: 'Guardian last name in English',
    example: 'Sharma',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly lastNameEn: string;

  @ApiPropertyOptional({
    description: 'Guardian first name in Nepali (Devanagari)',
    example: 'राम',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly firstNameNp?: string;

  @ApiPropertyOptional({
    description: 'Guardian middle name in Nepali (Devanagari)',
    example: 'बहादुर',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly middleNameNp?: string;

  @ApiPropertyOptional({
    description: 'Guardian last name in Nepali (Devanagari)',
    example: 'शर्मा',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly lastNameNp?: string;

  // === Relation ===
  @ApiProperty({
    description: 'Relationship of guardian to the student',
    example: 'FATHER',
    enum: [
      'FATHER',
      'MOTHER',
      'BROTHER',
      'SISTER',
      'GRANDFATHER',
      'GRANDMOTHER',
      'UNCLE',
      'AUNT',
      'GUARDIAN',
      'OTHER',
    ],
  })
  @IsNotEmpty()
  @IsEnum([
    'FATHER',
    'MOTHER',
    'BROTHER',
    'SISTER',
    'GRANDFATHER',
    'GRANDMOTHER',
    'UNCLE',
    'AUNT',
    'GUARDIAN',
    'OTHER',
  ])
  readonly relationToStudent: string;

  // === Occupation ===
  @ApiPropertyOptional({
    description: 'Guardian occupation/profession',
    example: 'Business Owner',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly occupation?: string;

  @ApiPropertyOptional({
    description: 'Organization/company where guardian works',
    example: 'ABC Trading Pvt. Ltd.',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly organization?: string;

  @ApiPropertyOptional({
    description: 'Job designation/position',
    example: 'Managing Director',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly designation?: string;

  @ApiPropertyOptional({
    description: 'Highest education level attained',
    example: 'Masters Degree',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly educationLevel?: string;

  @ApiPropertyOptional({
    description: 'Annual income in NPR',
    example: 1200000,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  readonly annualIncome?: number;

  // === Contact ===
  @ApiProperty({
    description: 'Primary mobile number (Nepali format)',
    example: '9841234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @IsNotEmpty()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  readonly mobile: string;

  @ApiPropertyOptional({
    description: 'Alternate mobile number (Nepali format)',
    example: '9851234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  readonly alternateMobile?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'ram.sharma@example.com',
    type: String,
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number (Nepali format)',
    example: '9841234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  readonly whatsappNumber?: string;

  // === Address (English) - Nepal provinces 1-7 ===
  @ApiPropertyOptional({
    description: 'Province ID (1-7)',
    example: 3,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  @Max(7, { message: 'Province ID must be between 1 and 7 (Nepal)' })
  readonly provinceId?: number;

  @ApiPropertyOptional({
    description: 'District ID',
    example: 27,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly districtId?: number;

  @ApiPropertyOptional({
    description: 'Municipality ID',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly municipalityId?: number;

  @ApiPropertyOptional({
    description: 'Ward number',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly wardNo?: number;

  @ApiPropertyOptional({
    description: 'Tole/locality name in English',
    example: 'Dillibazar',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly toleEn?: string;

  @ApiPropertyOptional({
    description: 'Full address in English',
    example: 'Near Police Headquarters',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly addressEn?: string;

  // === Address (Nepali) ===
  @ApiPropertyOptional({
    description: 'Tole/locality name in Nepali',
    example: 'दिल्लीबजार',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly toleNp?: string;

  @ApiPropertyOptional({
    description: 'Full address in Nepali',
    example: 'प्रहरी प्रधान कार्यालय नजिक',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly addressNp?: string;
}
