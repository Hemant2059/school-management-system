import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import {
  PortalService,
  StudentDashboard,
  ParentDashboard,
} from './portal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('portal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('student/dashboard')
  @Roles('student')
  async getStudentDashboard(@Req() req): Promise<StudentDashboard> {
    return this.portalService.getStudentDashboard(
      req.user.schoolId,
      req.user.userId,
    );
  }

  @Get('student/profile')
  @Roles('student')
  async getStudentProfile(@Req() req) {
    return this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
  }

  @Get('student/attendance')
  @Roles('student')
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
  async getStudentExams(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getUpcomingExams(req.user.schoolId, profile.id);
  }

  @Get('student/assignments')
  @Roles('student')
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
  async getStudentMarks(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getRecentMarks(req.user.schoolId, profile.id);
  }

  @Get('student/fees')
  @Roles('student')
  async getStudentFees(@Req() req) {
    const profile = await this.portalService.getStudentProfile(
      req.user.schoolId,
      req.user.userId,
    );
    return this.portalService.getFeeStatus(req.user.schoolId, profile.id);
  }

  @Get('parent/dashboard')
  @Roles('guardian')
  async getParentDashboard(@Req() req): Promise<ParentDashboard> {
    return this.portalService.getParentDashboard(
      req.user.schoolId,
      req.user.userId,
    );
  }

  @Get('parent/children')
  @Roles('guardian')
  async getChildren(@Req() req) {
    return this.portalService.getChildren(req.user.schoolId, req.user.userId);
  }

  @Get('parent/child/:id')
  @Roles('guardian')
  async getChildDetails(@Param('id') id: number, @Req() req) {
    return this.portalService.getChildDetails(
      req.user.schoolId,
      req.user.userId,
      id,
    );
  }
}
