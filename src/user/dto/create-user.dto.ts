import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  Matches,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'School ID this user belongs to',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  schoolId: number;

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

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@school.edu.np',
    type: String,
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Nepali mobile number (10 digits starting with 98, 97, or 96)',
    example: '9841234567',
    type: String,
    pattern: '^(98|97|96)\\d{8}$',
  })
  @Matches(/^(98|97|96)\d{8}$/, { message: 'Invalid Nepali mobile number' })
  phone: string;

  @ApiProperty({
    description: 'Role/type of the user in the system',
    example: 'TEACHER',
    enum: ['ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT', 'ACCOUNTANT'],
  })
  @IsEnum(['ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT', 'ACCOUNTANT'])
  userType: string;
}
