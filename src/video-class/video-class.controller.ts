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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Video Class Management')
@ApiBearerAuth()
@Controller('video-classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoClassController {
  constructor(private readonly videoClassService: VideoClassService) {}

  @Post()
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Create live class',
    description: 'Schedule a new live/online class session.',
  })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 201,
    description: 'Live class created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Teacher role required',
  })
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
  @ApiOperation({
    summary: 'Get live classes',
    description: 'Retrieve live classes for a specific class.',
  })
  @ApiQuery({
    name: 'classId',
    description: 'Class ID',
    example: 5,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of live classes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLiveClasses(
    @Query('classId') classId: number,
    @Req() req,
  ): Promise<LiveClass[]> {
    return this.videoClassService.getLiveClasses(req.user.schoolId, classId);
  }

  @Get('upcoming')
  @Roles('admin', 'teacher', 'student')
  @ApiOperation({
    summary: 'Get upcoming live classes',
    description: 'Retrieve upcoming scheduled live class sessions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming live classes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUpcomingClasses(@Req() req): Promise<LiveClass[]> {
    return this.videoClassService.getUpcomingClasses(req.user.schoolId);
  }

  @Get('live')
  @ApiOperation({
    summary: 'Get currently live classes',
    description: 'Retrieve all classes that are currently live streaming.',
  })
  @ApiResponse({
    status: 200,
    description: 'Currently live classes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLiveNowClasses(@Req() req): Promise<LiveClass[]> {
    return this.videoClassService.getLiveNowClasses(req.user.schoolId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get live class by ID',
    description: 'Retrieve detailed information about a specific live class.',
  })
  @ApiParam({
    name: 'id',
    description: 'Live class ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Live class details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Live class not found' })
  async getLiveClassById(
    @Param('id') id: number,
    @Req() req,
  ): Promise<LiveClass> {
    return this.videoClassService.getLiveClassById(id, req.user.schoolId);
  }

  @Put(':id/start')
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'Start live class',
    description: 'Start a scheduled live class session.',
  })
  @ApiParam({
    name: 'id',
    description: 'Live class ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Live class started successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Teacher role required',
  })
  @ApiResponse({ status: 404, description: 'Live class not found' })
  async startLiveClass(
    @Param('id') id: number,
    @Req() req,
  ): Promise<LiveClass> {
    return this.videoClassService.startLiveClass(id, req.user.schoolId);
  }

  @Put(':id/end')
  @Roles('admin', 'teacher')
  @ApiOperation({
    summary: 'End live class',
    description:
      'End an ongoing live class session with optional recording URL.',
  })
  @ApiParam({
    name: 'id',
    description: 'Live class ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        recordingUrl: {
          type: 'string',
          description: 'URL to the recorded session',
          example: 'https://example.com/recordings/class-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Live class ended successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Teacher role required',
  })
  @ApiResponse({ status: 404, description: 'Live class not found' })
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
  @ApiOperation({
    summary: 'Delete live class',
    description: 'Remove a live class from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Live class ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Live class deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Live class not found' })
  async deleteLiveClass(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.videoClassService.deleteLiveClass(id, req.user.schoolId);
    return { message: 'Live class deleted successfully' };
  }
}
