import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchoolInfoDto {
  @ApiProperty({ description: 'School ID', example: 1 })
  schoolId: number;

  @ApiProperty({ description: 'School code', example: 'SCH-101' })
  schoolCode: string;

  @ApiProperty({ description: 'School name', example: 'Everest Public School' })
  schoolName: string;

  @ApiPropertyOptional({
    description: 'School name in Nepali',
    example: 'एभरेस्ट पब्लिक स्कूल',
  })
  schoolNameNepali?: string;
}

export class ProfileResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  userId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  schoolId: number;

  @ApiProperty({ description: 'Username', example: 'john.doe' })
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@school.edu.np',
  })
  email: string;

  @ApiProperty({ description: 'Phone number', example: '9841234567' })
  phone: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  fullName: string;

  @ApiProperty({
    description: 'User type',
    enum: ['ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT', 'ACCOUNTANT'],
    example: 'TEACHER',
  })
  userType: string;

  @ApiProperty({ description: 'Is verified', example: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ description: 'Last login IP address' })
  lastLoginIp?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'School information' })
  school: SchoolInfoDto;
}
