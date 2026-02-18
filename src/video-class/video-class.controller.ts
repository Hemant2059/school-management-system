import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VideoClassService } from './video-class.service';
import type { CreateLiveClassDto, LiveClass } from './video-class.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('video-classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoClassController {
  constructor(private readonly videoClassService: VideoClassService) {}

  @Post()
  @Roles('admin', 'teacher')
  async createLiveClass(
    @Body() dto: CreateLiveClassDto,
    @Req() req,
  ): Promise<LiveClass> {
    return this.videoClassService.createLiveClass(
      req.user.schoolId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  async getLiveClasses(
    @Query('classId') classId: number,
    @Req() req,
  ): Promise<LiveClass[]> {
    return this.videoClassService.getLiveClasses(req.user.schoolId, classId);
  }

  @Get('upcoming')
  @Roles('admin', 'teacher', 'student')
  async getUpcomingClasses(@Req() req): Promise<LiveClass[]> {
    return this.videoClassService.getUpcomingClasses(req.user.schoolId);
  }

  @Get('live')
  async getLiveNowClasses(@Req() req): Promise<LiveClass[]> {
    return this.videoClassService.getLiveNowClasses(req.user.schoolId);
  }

  @Get(':id')
  async getLiveClassById(
    @Param('id') id: number,
    @Req() req,
  ): Promise<LiveClass> {
    return this.videoClassService.getLiveClassById(id, req.user.schoolId);
  }

  @Put(':id/start')
  @Roles('admin', 'teacher')
  async startLiveClass(
    @Param('id') id: number,
    @Req() req,
  ): Promise<LiveClass> {
    return this.videoClassService.startLiveClass(id, req.user.schoolId);
  }

  @Put(':id/end')
  @Roles('admin', 'teacher')
  async endLiveClass(
    @Param('id') id: number,
    @Body() body: { recordingUrl?: string },
    @Req() req,
  ): Promise<LiveClass> {
    return this.videoClassService.endLiveClass(
      id,
      req.user.schoolId,
      body.recordingUrl,
    );
  }

  @Delete(':id')
  @Roles('admin')
  async deleteLiveClass(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.videoClassService.deleteLiveClass(id, req.user.schoolId);
    return { message: 'Live class deleted successfully' };
  }
}
