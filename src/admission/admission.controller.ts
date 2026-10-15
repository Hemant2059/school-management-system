import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdmissionService } from './admission.service';
import type { CreateAdmissionDto, OnlineAdmission } from './admission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post('apply')
  async submitApplication(
    @Body() dto: CreateAdmissionDto,
    @Query('schoolId') schoolId: number,
  ): Promise<OnlineAdmission> {
    return this.admissionService.createApplication(schoolId, dto);
  }

  @Get('track/:applicationNo')
  async trackApplication(
    @Param('applicationNo') applicationNo: string,
    @Query('schoolId') schoolId: number,
  ): Promise<OnlineAdmission> {
    return this.admissionService.getApplicationByNo(applicationNo, schoolId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getApplications(
    @Query('status') status: string,
    @Req() req,
  ): Promise<OnlineAdmission[]> {
    return this.admissionService.getApplications(req.user.schoolId, status);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics(@Req() req) {
    return this.admissionService.getAdmissionStatistics(req.user.schoolId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getApplication(
    @Param('id') id: number,
    @Req() req,
  ): Promise<OnlineAdmission> {
    return this.admissionService.getApplicationById(id, req.user.schoolId);
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reviewApplication(
    @Param('id') id: number,
    @Body()
    body: { status: 'reviewed' | 'approved' | 'rejected'; remarks?: string },
    @Req() req,
  ): Promise<OnlineAdmission> {
    return this.admissionService.reviewApplication(
      id,
      req.user.schoolId,
      body.status,
      body.remarks || '',
      req.user.userId,
    );
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async enrollStudent(
    @Param('id') id: number,
    @Body()
    body: { sectionId: number; admissionDateBs?: string },
    @Req() req,
  ): Promise<{ studentId: number; userId: number }> {
    return this.admissionService.enrollStudent(
      id,
      req.user.schoolId,
      body.sectionId,
      req.user.userId,
      body.admissionDateBs,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteApplication(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.admissionService.deleteApplication(id, req.user.schoolId);
    return { message: 'Application deleted successfully' };
  }
}
