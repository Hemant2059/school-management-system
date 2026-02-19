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
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Create Webhook',
    description: `Create a webhook endpoint for real-time event notifications.

**Features:**
- Define webhook URL
- Select event types to trigger
- Secret key for signature verification
- Enable/disable webhook`,
  })
  @ApiBody({
    description: 'Webhook creation data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        webhookType: { type: 'string', example: 'FEE' },
        name: { type: 'string', example: 'Fee Payment Webhook' },
        url: { type: 'string', example: 'https://example.com/webhook/fee' },
        events: {
          type: 'array',
          items: { type: 'string', example: 'PAYMENT_CREATED' },
        },
        secretKey: { type: 'string', example: 'whsec_...' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Webhook created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Fee Payment Webhook' },
        isActive: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Webhook created successfully' },
      },
    },
  })
  create(
    @Body()
    dto: {
      schoolId: number;
      webhookType: string;
      name: string;
      url: string;
      events: string[];
      createdBy?: number;
      secretKey?: string;
    },
  ) {
    return this.webhookService.createWebhook(
      dto.schoolId,
      dto.webhookType,
      dto.name,
      dto.url,
      dto.events,
      dto.createdBy,
      dto.secretKey,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Get Webhooks',
    description: `Get all webhooks for a school.`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'type',
    description: 'Webhook type filter',
    example: 'FEE',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhooks list',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Fee Payment Webhook' },
          url: { type: 'string', example: 'https://example.com/webhook' },
          isActive: { type: 'boolean', example: true },
          eventCount: { type: 'number', example: 3 },
        },
      },
    },
  })
  findAll(@Query('schoolId') schoolId: number, @Query('type') type?: string) {
    return this.webhookService.getWebhooks(schoolId, type);
  }

  @Get(':webhookId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Get Webhook by ID',
    description: `Get webhook details by ID.`,
  })
  @ApiParam({
    name: 'webhookId',
    description: 'Webhook ID',
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
    description: 'Webhook details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Fee Payment Webhook' },
        url: { type: 'string', example: 'https://example.com/webhook' },
        events: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  findOne(
    @Param('webhookId') webhookId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.webhookService.getWebhookById(webhookId, schoolId);
  }

  @Put(':webhookId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Update Webhook',
    description: `Update webhook configuration.`,
  })
  @ApiParam({
    name: 'webhookId',
    description: 'Webhook ID',
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
    description: 'Webhook updated',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Webhook updated successfully' },
      },
    },
  })
  update(
    @Param('webhookId') webhookId: number,
    @Query('schoolId') schoolId: number,
    @Body()
    dto: { name?: string; url?: string; events?: string[]; isActive?: boolean },
  ) {
    return this.webhookService.updateWebhook(webhookId, schoolId, dto);
  }

  @Delete(':webhookId')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Delete Webhook',
    description: `Delete a webhook endpoint.`,
  })
  @ApiParam({
    name: 'webhookId',
    description: 'Webhook ID',
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
    description: 'Webhook deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Webhook deleted successfully' },
      },
    },
  })
  remove(
    @Param('webhookId') webhookId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.webhookService.deleteWebhook(webhookId, schoolId);
  }

  @Get(':webhookId/logs')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Get Webhook Delivery Logs',
    description: `Get webhook delivery history and status.`,
  })
  @ApiParam({
    name: 'webhookId',
    description: 'Webhook ID',
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
    description: 'Webhook logs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          event: { type: 'string', example: 'PAYMENT_CREATED' },
          status: { type: 'string', example: 'SUCCESS' },
          responseCode: { type: 'number', example: 200 },
          timestamp: { type: 'string', example: '2081-04-15T10:30:00Z' },
        },
      },
    },
  })
  getLogs(
    @Param('webhookId') webhookId: number,
    @Query('schoolId') schoolId: number,
  ) {
    return this.webhookService.getWebhookLogs(webhookId, schoolId);
  }

  @Post('trigger')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ADMIN)
  @ApiOperation({
    summary: 'Manually Trigger Webhook',
    description: `Manually trigger webhook for testing an event.`,
  })
  @ApiBody({
    description: 'Trigger data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        eventType: { type: 'string', example: 'PAYMENT_CREATED' },
        data: { type: 'object', example: { paymentId: 1, amount: 5000 } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook triggered',
    schema: {
      type: 'object',
      properties: {
        webhookId: { type: 'number', example: 1 },
        status: { type: 'string', example: 'TRIGGERED' },
      },
    },
  })
  trigger(
    @Body()
    dto: {
      schoolId: number;
      eventType: string;
      data: Record<string, unknown>;
    },
  ) {
    return this.webhookService.triggerWebhook(
      dto.schoolId,
      dto.eventType,
      dto.data,
    );
  }
}
