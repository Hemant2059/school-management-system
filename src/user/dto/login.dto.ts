import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Username or email for authentication',
    example: 'admin@school.edu.np',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'SecurePass123!',
    type: String,
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description:
      'School code to log into (for users belonging to multiple schools). Defaults to the primary school.',
    example: 'SNP-001',
  })
  @IsOptional()
  @IsString()
  schoolCode?: string;
}
