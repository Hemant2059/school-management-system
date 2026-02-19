import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import {
  PortalService,
  StudentDashboard,
  ParentDashboard,
} from './portal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Student & Parent Portal')
@ApiBearerAuth()
@Controller('portal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('student/dashboard')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student dashboard',
    description: 'Retrieve personalized dashboard for student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student dashboard retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentDashboard(@Req() req): Promise<StudentDashboard> {
    return this.portalService.getStudentDashboard(
      req.user.schoolId,
      req.user.userId,
    );
  }

  @Get('student/profile')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student profile',
    description: 'Retrieve profile information for the logged-in student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentProfile(@Req() req) {
    return this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
  }

  @Get('student/attendance')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student attendance',
    description: 'Retrieve attendance records for the logged-in student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student attendance retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentAttendance(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getStudentAttendance(
      req.user.schoolId,
      profile.id,
    );
  }

  @Get('student/exams')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student exams',
    description: 'Retrieve upcoming exams for the logged-in student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student exams retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentExams(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getUpcomingExams(req.user.schoolId, profile.id);
  }

  @Get('student/assignments')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student assignments',
    description: 'Retrieve pending assignments for the logged-in student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student assignments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentAssignments(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getPendingAssignments(
      req.user.schoolId,
      profile.id,
    );
  }

  @Get('student/marks')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student marks',
    description: 'Retrieve recent marks/grades for the logged-in student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student marks retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentMarks(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getRecentMarks(req.user.schoolId, profile.id);
  }

  @Get('student/fees')
  @Roles('student')
  @ApiOperation({
    summary: 'Get student fees',
    description: 'Retrieve fee status for the logged-in student.',
  })
  @ApiResponse({
    status: 200,
    description: 'Student fees retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Student role required',
  })
  async getStudentFees(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getFeeStatus(req.user.schoolId, profile.id);
  }

  @Get('parent/dashboard')
  @Roles('guardian')
  @ApiOperation({
    summary: 'Get parent dashboard',
    description: 'Retrieve personalized dashboard for parent/guardian.',
  })
  @ApiResponse({
    status: 200,
    description: 'Parent dashboard retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Guardian role required',
  })
  async getParentDashboard(@Req() req): Promise<ParentDashboard> {
    return this.portalService.getParentDashboard(
      req.user.schoolId,
      req.user.userId,
    );
  }

  @Get('parent/children')
  @Roles('guardian')
  @ApiOperation({
    summary: 'Get guardian children',
    description: 'Retrieve list of children linked to the guardian account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Children list retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Guardian role required',
  })
  async getChildren(@Req() req) {
    return this.portalService.getChildren(req.user.schoolId, req.user.userId);
  }

  @Get('parent/child/:id')
  @Roles('guardian')
  @ApiOperation({
    summary: 'Get child details',
    description: 'Retrieve detailed information about a specific child.',
  })
  @ApiParam({
    name: 'id',
    description: 'Child/Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Child details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Guardian role required',
  })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async getChildDetails(@Param('id') id: number, @Req() req) {
    return this.portalService.getChildDetails(
      req.user.schoolId,
      req.user.userId,
      id,
    );
  }
}
