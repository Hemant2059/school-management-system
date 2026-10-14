import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsDate,
  Matches,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsInt()
  readonly userId: number;

  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({
    description: 'First name in English',
    example: 'Krishna',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly firstNameEn: string;

  @ApiPropertyOptional({
    description: 'Middle name in English',
    example: 'Bahadur',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly middleNameEn?: string;

  @ApiProperty({
    description: 'Last name in English',
    example: 'Thapa',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly lastNameEn: string;

  @ApiPropertyOptional({
    description: 'First name in Nepali',
    example: 'कृष्ण',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly firstNameNp?: string;

  @ApiPropertyOptional({
    description: 'Middle name in Nepali',
    example: 'बहादुर',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly middleNameNp?: string;

  @ApiPropertyOptional({
    description: 'Last name in Nepali',
    example: 'थापा',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly lastNameNp?: string;

  @ApiPropertyOptional({
    description: 'Citizenship number',
    example: '123-45-67890',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly citizenshipNumber?: string;

  @ApiPropertyOptional({
    description: 'PAN (Permanent Account Number) - must be 9 digits',
    example: '123456789',
    type: String,
    pattern: '^[0-9]{9}$',
  })
  @IsOptional()
  @Matches(/^[0-9]{9}$/, { message: 'PAN must be 9 digits' })
  readonly panNumber?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-05-15T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  readonly dateOfBirth?: Date;

  @ApiProperty({
    description: 'Gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsNotEmpty()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  readonly gender: string;

  @ApiProperty({
    description: 'Job position/designation',
    example: 'Administrative Officer',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly position: string;

  @ApiPropertyOptional({
    description: 'Designation in Nepali (provided by frontend alongside position)',
    example: 'प्रशासनिक अधिकृत',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly designationNp?: string;

  @ApiPropertyOptional({
    description: 'Department',
    example: 'Administration',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly department?: string;

  @ApiPropertyOptional({
    description: 'Department in Nepali (provided by frontend)',
    example: 'प्रशासन',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly departmentNp?: string;

  @ApiProperty({
    description: 'Date of hiring/joining',
    example: '2020-01-15T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly hireDate: Date;

  @ApiProperty({
    description: 'Type of employment',
    example: 'PERMANENT',
    enum: ['PERMANENT', 'CONTRACT', 'PART_TIME', 'CASUAL'],
  })
  @IsNotEmpty()
  @IsEnum(['PERMANENT', 'CONTRACT', 'PART_TIME', 'CASUAL'])
  readonly employmentType: string;

  @ApiPropertyOptional({
    description: 'Employment type in Nepali (provided by frontend)',
    example: 'स्थायी',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly employmentTypeNp?: string;

  @ApiPropertyOptional({
    description: 'Mobile phone number',
    example: '9841234567',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly mobile?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'krishna.thapa@school.edu.np',
    type: String,
    format: 'email',
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'Province ID for address',
    example: 3,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly provinceId?: number;

  @ApiPropertyOptional({
    description: 'District ID for address',
    example: 27,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  readonly districtId?: number;

  @ApiPropertyOptional({
    description: 'Municipality ID for address',
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
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  readonly wardNo?: number;

  @ApiPropertyOptional({
    description: 'Tole/locality in English',
    example: 'Baneshwor',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly toleEn?: string;

  @ApiPropertyOptional({
    description: 'Tole/locality in Nepali',
    example: 'बानेश्वर',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly toleNp?: string;

  @ApiPropertyOptional({
    description: 'Detailed address in Nepali',
    example: 'बानेश्वर चोक नजिक',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly addressNp?: string;
}
