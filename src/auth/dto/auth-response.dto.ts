import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique session identifier',
  })
  sessionId: string;

  @ApiProperty({
    description: 'User information',
    example: {
      userId: 1,
      schoolId: 1,
      username: 'john.doe',
      email: 'john.doe@school.edu.np',
      fullName: 'John Doe',
      userType: 'TEACHER',
    },
  })
  user: {
    userId: number;
    schoolId: number;
    username: string;
    email: string;
    fullName: string;
    userType: string;
  };
}
