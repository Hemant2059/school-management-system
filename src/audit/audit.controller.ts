import { Controller, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Get All Audit Logs',
    description: `Retrieve audit logs with filters.

**Query Parameters:**
- schoolId: Required for filtering
- userId: Optional filter by user
- action: Optional filter by action type
- entityType: Optional filter by entity
- startDate, endDate: Date range filter
- page, limit: Pagination`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'userId',
    description: 'User ID',
    example: 1,
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'action',
    description: 'Action type',
    example: 'CREATE',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          userId: { type: 'number', example: 1 },
          action: { type: 'string', example: 'CREATE' },
          entityType: { type: 'string', example: 'STUDENT' },
          entityId: { type: 'number', example: 123 },
          timestamp: { type: 'string', example: '2081-04-15T10:30:00Z' },
        },
      },
    },
  })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('activity-summary')
  @ApiOperation({
    summary: 'Get Activity Summary',
    description: `Get activity summary for a school.

**Returns:**
- Actions by type
- Most active users
- Entity counts`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date',
    example: '2081-04-01',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date',
    example: '2081-04-30',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity summary',
    schema: {
      type: 'object',
      properties: {
        totalActions: { type: 'number', example: 500 },
        byType: {
          type: 'object',
          example: { CREATE: 200, UPDATE: 150, DELETE: 50 },
        },
        topUsers: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  getActivitySummary(
    @Query('schoolId') schoolId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getActivitySummary(schoolId, startDate, endDate);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get Audit Logs for Entity',
    description: `Get all changes made to a specific entity.`,
  })
  @ApiParam({
    name: 'entityType',
    description: 'Entity type',
    example: 'STUDENT',
    type: String,
  })
  @ApiParam({
    name: 'entityId',
    description: 'Entity ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Entity audit history',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          action: { type: 'string', example: 'UPDATE' },
          changes: { type: 'object', example: { firstName: 'Ram' } },
          userId: { type: 'number', example: 1 },
          timestamp: { type: 'string', example: '2081-04-15T10:30:00Z' },
        },
      },
    },
  })
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: number,
    @Query('schoolId') schoolId?: number,
  ) {
    return this.auditService.findByEntity(entityType, entityId, schoolId);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get Audit Logs for User',
    description: `Get all activities performed by a specific user.`,
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Result limit',
    example: 50,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'User activity logs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          action: { type: 'string', example: 'CREATE' },
          entityType: { type: 'string', example: 'STUDENT' },
          timestamp: { type: 'string', example: '2081-04-15T10:30:00Z' },
        },
      },
    },
  })
  findByUser(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: number,
  ) {
    return this.auditService.findByUser(userId, limit, schoolId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Audit Log by ID',
    description: `Get detailed audit log entry by ID.`,
  })
  @ApiParam({ name: 'id', description: 'Log ID', example: 1, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Audit log details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        action: { type: 'string', example: 'UPDATE' },
        entityType: { type: 'string', example: 'STUDENT' },
        entityId: { type: 'number', example: 123 },
        changes: { type: 'object', example: {} },
        timestamp: { type: 'string', example: '2081-04-15T10:30:00Z' },
        ipAddress: { type: 'string', example: '192.168.1.1' },
      },
    },
  })
  findOne(@Param('id') id: number, @Query('schoolId') schoolId?: number) {
    return this.auditService.findById(id, schoolId);
  }
}
