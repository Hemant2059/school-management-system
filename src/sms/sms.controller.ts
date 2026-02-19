import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('SMS')
@ApiBearerAuth()
@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_SEND)
  @ApiOperation({
    summary: 'Send SMS to Phone Numbers',
    description: `Send SMS to specified phone numbers.

**Features:**
- Single or multiple recipients
- Custom message content
- Scheduled delivery option
- Delivery status tracking

**Note:** Message length should be within 160 characters for single SMS.`,
  })
  @ApiBody({
    description: 'SMS data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        recipients: {
          type: 'array',
          items: { type: 'string', example: '9841234567' },
        },
        message: {
          type: 'string',
          example:
            'Your ward Ram Sharma attended the parent-teacher meeting today.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'SMS sent successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', example: 'SMS-2024-001' },
        status: { type: 'string', example: 'SENT' },
        recipientCount: { type: 'number', example: 1 },
      },
    },
  })
  sendSms(@Body() dto: any) {
    return this.smsService.sendSms(dto.schoolId, dto);
  }

  @Post('attendance')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_SEND)
  @ApiOperation({
    summary: 'Send Attendance SMS to Parents',
    description: `Send attendance notification to parents/guardians.

**Features:**
- Auto-fetch guardian mobile numbers
- Send to all or specific students
- Configurable message templates
- Daily/periodic attendance reports

**Note:** Requires student-guardian link to be established.`,
  })
  @ApiBody({
    description: 'Attendance SMS data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        date: { type: 'string', example: '2081-04-15' },
        status: {
          type: 'string',
          example: 'ABSENT',
          enum: ['ABSENT', 'PRESENT', 'LATE'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Attendance SMS sent',
    schema: {
      type: 'object',
      properties: {
        sentCount: { type: 'number', example: 25 },
        failedCount: { type: 'number', example: 2 },
      },
    },
  })
  sendAttendanceSms(@Body() dto: any) {
    return this.smsService.sendAttendanceSms(dto.schoolId, dto);
  }

  @Post('fee-due')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_SEND)
  @ApiOperation({
    summary: 'Send Fee Due SMS to Parents',
    description: `Send fee due reminder to parents/guardians.

**Features:**
- Target specific class or all students
- Include fee amount and due date
- Configurable message templates
- Track who received reminders

**Note:** Only sends to guardians with valid mobile numbers.`,
  })
  @ApiBody({
    description: 'Fee due SMS data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        classId: { type: 'number', example: 10 },
        categoryId: { type: 'number', example: 1 },
        message: {
          type: 'string',
          example:
            'Dear Parent, tuition fee of Rs. 5000 is due for your ward. Please pay by 15th April.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fee due SMS sent',
    schema: {
      type: 'object',
      properties: {
        sentCount: { type: 'number', example: 30 },
        totalDueAmount: { type: 'number', example: 150000 },
      },
    },
  })
  sendFeeDueSms(@Body() dto: any) {
    return this.smsService.sendFeeDueSms(dto.schoolId, dto);
  }

  @Post('broadcast')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_SEND)
  @ApiOperation({
    summary: 'Send Emergency Broadcast SMS',
    description: `Send emergency broadcast to all parents.

**Features:**
- Bulk send to all registered guardians
- High priority delivery
- Message templates for common scenarios
- Delivery reports

**Note:** Use sparingly for genuine emergencies only.`,
  })
  @ApiBody({
    description: 'Broadcast SMS data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        message: {
          type: 'string',
          example:
            'URGENT: School will remain closed tomorrow due to heavy rainfall.',
        },
        priority: { type: 'string', example: 'HIGH' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Broadcast sent',
    schema: {
      type: 'object',
      properties: {
        sentCount: { type: 'number', example: 500 },
        status: { type: 'string', example: 'BROADCAST_SENT' },
      },
    },
  })
  sendBroadcast(@Body() dto: any) {
    return this.smsService.sendEmergencyBroadcast(dto.schoolId, dto);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_TEMPLATE)
  @ApiOperation({
    summary: 'Create SMS Template',
    description: `Create reusable SMS templates.

**Features:**
- Pre-defined templates
- Variable placeholders
- Category organization

**Note:** Templates help maintain consistency and save time.`,
  })
  @ApiBody({
    description: 'Template data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Attendance Alert' },
        category: { type: 'string', example: 'ATTENDANCE' },
        content: {
          type: 'string',
          example:
            'Dear Parent, your ward {{studentName}} was {{status}} today.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Template created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Attendance Alert' },
        message: { type: 'string', example: 'Template created successfully' },
      },
    },
  })
  createTemplate(@Body() dto: any) {
    return this.smsService.createTemplate(dto.schoolId, dto);
  }

  @Get('templates')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_TEMPLATE)
  @ApiOperation({
    summary: 'Get SMS Templates',
    description: `Retrieve all SMS templates for a school.

**Query Parameters:**
- schoolId: Required for filtering

**Returns:**
- Template name and content
- Category
- Usage count`,
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
    description: 'SMS templates',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Attendance Alert' },
          category: { type: 'string', example: 'ATTENDANCE' },
          content: { type: 'string', example: 'Dear Parent...' },
        },
      },
    },
  })
  getTemplates(@Query('schoolId') schoolId: number) {
    return this.smsService.getTemplates(schoolId);
  }

  @Get('logs')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SMS_SEND)
  @ApiOperation({
    summary: 'Get SMS Logs',
    description: `Retrieve SMS delivery logs.

**Query Parameters:**
- schoolId: Required for filtering
- startDate: Optional filter start
- endDate: Optional filter end
- status: Optional filter by status (SENT, FAILED, DELIVERED)

**Returns:**
- Message content
- Recipients
- Delivery status
- Timestamps`,
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
    description: 'Start date (optional)',
    example: '2081-04-01',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date (optional)',
    example: '2081-04-30',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Status (optional)',
    example: 'DELIVERED',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'SMS logs',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          message: { type: 'string', example: 'Dear Parent...' },
          recipient: { type: 'string', example: '9841234567' },
          status: { type: 'string', example: 'DELIVERED' },
          sentAt: { type: 'string', example: '2081-04-15T10:30:00Z' },
        },
      },
    },
  })
  getLogs(
    @Query('schoolId') schoolId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.smsService.getSmsLogs(schoolId, { startDate, endDate, status });
  }
}
