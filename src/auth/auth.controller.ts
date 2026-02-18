import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with username/email and password. Tracks device and IP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
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
    summary: 'Register new user',
    description: 'Create a new user account.',
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate current session. Requires refresh token in body.',
  })
  async logout(@Request() req, @Body() body: RefreshTokenDto) {
    if (req.user) {
      await this.authService.logout(req.user.userId, body.refreshToken);
      return { message: 'Successfully logged out from this device' };
    }
    return { message: 'No active session found' };
  }

  @Post('logout-all')
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
    summary: 'Refresh access token',
    description:
      'Obtain new access token while updating current session activity.',
  })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.refreshTokens(body.refreshToken, ip, userAgent);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieve authenticated user profile information with school details.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: ProfileResponseDto,
  })
  async getProfile(@Request() req) {
    const user = await this.authService.getUserProfile(req.user.userId);
    return user;
  }

  @Post('change-password')
  @ApiOperation({
    summary: 'Change password',
    description: 'Change user password. Required on first login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
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
    summary: 'Request password reset',
    description: 'Send password reset link to user email/phone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent',
  })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using reset token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
