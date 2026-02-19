import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Push Offline Changes to Server',
    description: `Upload offline data changes to the server.

**Features:**
- Batch upload of offline changes
- Conflict detection
- Automatic merge or flag for review`,
  })
  @ApiBody({
    description: 'Offline changes data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        deviceId: { type: 'string', example: 'device-001' },
        changes: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Changes synced',
    schema: {
      type: 'object',
      properties: {
        syncId: { type: 'number', example: 1 },
        status: { type: 'string', example: 'SYNCED' },
        conflicts: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  pushChanges(@Body() dto: any) {
    return this.syncService.pushChanges(dto);
  }

  @Get('pull')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Pull Changes from Server',
    description: `Download server changes for offline sync.

**Query Parameters:**
- deviceId: Optional - specific device
- since: Optional - timestamp for incremental sync`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'deviceId',
    description: 'Device ID',
    example: 'device-001',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'since',
    description: 'Sync timestamp',
    example: '2081-04-15T10:30:00Z',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Changes retrieved',
    schema: {
      type: 'object',
      properties: {
        changes: { type: 'array', items: { type: 'object' } },
        lastSync: { type: 'string', example: '2081-04-15T10:30:00Z' },
      },
    },
  })
  pullChanges(
    @Query('schoolId') schoolId: number,
    @Query('deviceId') deviceId?: string,
    @Query('since') since?: string,
  ) {
    return this.syncService.pullChanges(
      schoolId,
      deviceId || '',
      undefined,
      since,
    );
  }

  @Post('acknowledge')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Acknowledge Processed Changes',
    description: `Mark sync changes as acknowledged after successful processing.`,
  })
  @ApiBody({
    description: 'Acknowledgment data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        syncIds: { type: 'array', items: { type: 'number', example: 1 } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Changes acknowledged',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Changes acknowledged successfully',
        },
      },
    },
  })
  acknowledge(@Body() dto: { schoolId: number; syncIds: number[] }) {
    return this.syncService.acknowledge(dto.schoolId, dto.syncIds);
  }

  @Get('status')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Get Sync Status',
    description: `Get current sync status for a school/device.

**Returns:**
- Pending changes count
- Last sync timestamp
- Device status`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'deviceId',
    description: 'Device ID',
    example: 'device-001',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Sync status',
    schema: {
      type: 'object',
      properties: {
        pendingChanges: { type: 'number', example: 15 },
        lastSync: { type: 'string', example: '2081-04-15T10:30:00Z' },
        deviceStatus: { type: 'string', example: 'ONLINE' },
      },
    },
  })
  getStatus(
    @Query('schoolId') schoolId: number,
    @Query('deviceId') deviceId?: string,
  ) {
    return this.syncService.getSyncStatus(schoolId, deviceId);
  }

  @Post('retry/:syncId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Retry Failed Sync',
    description: `Retry a failed sync operation.`,
  })
  @ApiParam({
    name: 'syncId',
    description: 'Sync ID',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Sync retried',
    schema: {
      type: 'object',
      properties: {
        syncId: { type: 'number', example: 1 },
        status: { type: 'string', example: 'RETRY_INITIATED' },
      },
    },
  })
  retry(@Param('syncId') syncId: number, @Query('schoolId') schoolId: number) {
    return this.syncService.retryFailed(schoolId, syncId);
  }
}
