import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  Matches,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'School ID (auto-set from auth for register)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  schoolId?: number;

  @ApiProperty({
    description: 'School ID snake_case (auto-set from auth)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  school_id?: number;

  @ApiProperty({
    description: 'Unique username for the user account',
    example: 'john.doe',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Strong password for the account (minimum 6 characters)',
    example: 'MySecure@Pass123',
    type: String,
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({
    description: 'Full name in Nepali (Devanagari, provided by frontend)',
    example: 'राम बहादुर',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  fullNameNp?: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@school.edu.np',
    type: String,
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Nepali mobile number (10 digits starting with 98, 97, or 96)',
    example: '9841234567',
    type: String,
    required: false,
  })
  @IsOptional()
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  phone?: string;

  @ApiProperty({
    description: 'Role/type of the user in the system',
    example: 'TEACHER',
    enum: [
      'SUPER_ADMIN',
      'ADMIN',
      'TEACHER',
      'STAFF',
      'STUDENT',
      'PARENT',
      'ACCOUNTANT',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'SUPER_ADMIN',
    'ADMIN',
    'TEACHER',
    'STAFF',
    'STUDENT',
    'PARENT',
    'ACCOUNTANT',
  ])
  userType?: string;

  @ApiPropertyOptional({
    description:
      'Platform user flag (SUPER_ADMIN only; manages all schools, no school scope)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
