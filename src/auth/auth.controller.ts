import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  Ip,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiExtraModels,
  ApiSchema,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiExtraModels(AuthResponseDto, ProfileResponseDto, RefreshTokenDto)
@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User Login',
    description: `Authenticate user and return JWT tokens.

**Flow:**
1. User submits username/email and password
2. System validates credentials against database
3. If valid, returns accessToken, refreshToken, sessionId
4. Use accessToken for subsequent API calls

**Error Codes:**
- 401: Invalid credentials
- 423: Account locked (too many failed attempts)
- 429: Too many attempts (rate limiting)

**Note:** This endpoint tracks IP address and user agent for security purposes.`,
  })
  @ApiBody({
    description: 'Login credentials',
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: {
          type: 'string',
          example: 'admin',
          description: 'Username or email',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: 'User password',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        sessionId: {
          type: 'string',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', example: 'admin@school.edu.np' },
            role: { type: 'string', example: 'ADMIN' },
            schoolId: { type: 'number', example: 1 },
            schoolName: {
              type: 'string',
              example: 'Kathmandu Model Secondary School',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 423,
    description: 'Account locked',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 423 },
        message: {
          type: 'string',
          example: 'Account is locked due to too many failed attempts',
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register New User',
    description: `Create a new user account in the system.

**Requirements:**
- Username must be unique
- Valid email address required
- Password must meet complexity requirements

**Note:** This endpoint may require admin approval depending on school settings.`,
  })
  @ApiBody({
    description: 'User registration data',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2 },
        username: { type: 'string', example: 'newuser' },
        email: { type: 'string', example: 'newuser@school.edu.np' },
        role: { type: 'string', example: 'TEACHER' },
        message: { type: 'string', example: 'Registration successful' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or username already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Username already exists' },
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('logout')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'User Logout',
    description: `Invalidate current session.

**Process:**
1. Requires refresh token in request body
2. Removes the session from active sessions
3. User will be logged out from current device only

**Note:** Use /auth/logout-all to logout from all devices.`,
  })
  @ApiBody({
    description: 'Refresh token for session invalidation',
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully logged out from this device',
        },
      },
    },
  })
  async logout(@Request() req, @Body() body: RefreshTokenDto) {
    if (req.user) {
      await this.authService.logout(req.user.userId, body.refreshToken);
      return { message: 'Successfully logged out from this device' };
    }
    return { message: 'No active session found' };
  }

  @Post('logout-all')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidates all active sessions for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
  })
  async logoutAll(@Request() req) {
    await this.authService.logoutAll(req.user.userId);
    return { message: 'Successfully logged out from all devices' };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: `Obtain new access token using refresh token.

**Process:**
1. User provides valid refresh token
2. System validates refresh token
3. Returns new accessToken and refreshToken
4. Updates session activity timestamp

**Use Case:** When access token expires, use this endpoint to get a new one without re-login.`,
  })
  @ApiBody({
    description: 'Refresh token',
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresIn: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
      },
    },
  })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.refreshTokens(body.refreshToken, ip, userAgent);
  }

  @Get('profile')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.USER_READ)
  @ApiOperation({
    summary: 'Get User Profile',
    description: `Retrieve authenticated user profile information with school details.

**Includes:**
- User personal information
- Role and permissions
- School details
- Session information`,
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'admin' },
        email: { type: 'string', example: 'admin@school.edu.np' },
        role: { type: 'string', example: 'ADMIN' },
        schoolId: { type: 'number', example: 1 },
        schoolName: {
          type: 'string',
          example: 'Kathmandu Model Secondary School',
        },
        permissions: { type: 'array', items: { type: 'string' } },
        lastLogin: { type: 'string', example: '2081-10-15T10:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req) {
    const user = await this.authService.getUserProfile(req.user.userId);
    return user;
  }

  @Post('change-password')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.USER_UPDATE)
  @ApiOperation({
    summary: 'Change Password',
    description: `Change user password.

**Requirements:**
- Current password must be correct
- New password must meet complexity requirements
- Minimum 8 characters

**Note:** Required on first login.`,
  })
  @ApiBody({
    description: 'Password change data',
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', example: 'oldPassword123' },
        newPassword: { type: 'string', example: 'newPassword456' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Current password is incorrect' },
      },
    },
  })
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request Password Reset',
    description: `Send password reset link to user email/phone.

**Process:**
1. User provides registered email or phone
2. System generates reset token
3. Reset link sent via email/SMS
4. Token valid for limited time (24 hours)

**Note:** Rate limited to prevent abuse.`,
  })
  @ApiBody({
    description: 'Email for password reset',
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', example: 'user@school.edu.np' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password reset link sent to your email',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Email not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Email not registered' },
      },
    },
  })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset Password',
    description: `Reset password using reset token.

**Process:**
1. User provides valid reset token
2. New password is set
3. All active sessions are invalidated
4. User must login with new password

**Note:** Token expires after 24 hours.`,
  })
  @ApiBody({
    description: 'New password with token',
    schema: {
      type: 'object',
      required: ['token', 'newPassword'],
      properties: {
        token: { type: 'string', example: 'abc123def456...' },
        newPassword: { type: 'string', example: 'newSecurePassword123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Password reset successfully. Please login with your new password.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid or expired reset token' },
      },
    },
  })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
