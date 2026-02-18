import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notification Management')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create notification',
    description: 'Create and send a notification to students or guardians.',
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  create(
    @Body() createDto: CreateNotificationDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.notificationService.create({ ...createDto, schoolId });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all notifications',
    description:
      'Retrieve notifications optionally filtered by school, student, guardian, or read status.',
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID (optional filter)',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'studentId',
    description: 'Student ID (optional filter)',
    example: 123,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'guardianId',
    description: 'Guardian ID (optional filter)',
    example: 45,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'isRead',
    description: 'Read status filter (true/false)',
    example: 'false',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @GetUser('schoolId') schoolId: number,
    @Query('studentId', new ParseIntPipe({ optional: true }))
    studentId?: number,
    @Query('guardianId', new ParseIntPipe({ optional: true }))
    guardianId?: number,
    @Query('isRead') isRead?: string,
  ) {
    const readStatus = isRead ? isRead === 'true' : undefined;
    return this.notificationService.findAll(
      schoolId,
      studentId,
      guardianId,
      readStatus,
    );
  }

  @Get('unread/count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Get count of unread notifications with latest 5 items.',
  })
  @ApiQuery({
    name: 'studentId',
    description: 'Student ID (optional filter)',
    example: 123,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'guardianId',
    description: 'Guardian ID (optional filter)',
    example: 45,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count and preview retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUnreadCount(
    @GetUser('schoolId') schoolId: number,
    @Query('studentId', new ParseIntPipe({ optional: true }))
    studentId?: number,
    @Query('guardianId', new ParseIntPipe({ optional: true }))
    guardianId?: number,
  ) {
    return this.notificationService
      .findAll(schoolId, studentId, guardianId, false)
      .then((notifications) => ({
        count: notifications.length,
        notifications: notifications.slice(0, 5),
      }));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve detailed information about a specific notification.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Notification details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.notificationService.findOne(id, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update notification',
    description: 'Update notification details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, schoolId, updateDto);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a single notification as read.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.notificationService.markAsRead(id, schoolId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications for a student or guardian as read.',
  })
  @ApiQuery({
    name: 'studentId',
    description: 'Student ID (optional)',
    example: 123,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'guardianId',
    description: 'Guardian ID (optional)',
    example: 45,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAllAsRead(
    @GetUser('schoolId') schoolId: number,
    @Query('studentId', new ParseIntPipe({ optional: true }))
    studentId?: number,
    @Query('guardianId', new ParseIntPipe({ optional: true }))
    guardianId?: number,
  ) {
    return this.notificationService.markAllAsRead(
      schoolId,
      studentId,
      guardianId,
    );
  }

  @Post(':id/send-sms')
  @ApiOperation({
    summary: 'Send notification via SMS',
    description: 'Send the notification to recipients via SMS.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'SMS sent successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  sendSms(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.notificationService.sendSmsNotification(id, schoolId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Remove a notification from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.notificationService.remove(id, schoolId);
  }
}
