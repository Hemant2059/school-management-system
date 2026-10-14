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
  ApiParam,
} from '@nestjs/swagger';
import { AcademicCalendarService } from './academic-calendar.service';
import { CreateCalendarEventDto } from './dto/calendar.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Academic Calendar')
@Controller('academic-calendar')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AcademicCalendarController {
  constructor(private readonly calendarService: AcademicCalendarService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_CREATE)
  @ApiOperation({
    summary: 'Create Calendar Event',
    description: `Create a new calendar event for the school.

**Features:**
- Event types: HOLIDAY, EXAM, EVENT, ACTIVITY
- Date and time scheduling
- For specific class or whole school
- Recurring event support`,
  })
  @ApiBody({
    description: 'Calendar event data',
    schema: {
      type: 'object',
      properties: {
        schoolId: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Dashain Vacation' },
        description: {
          type: 'string',
          example: 'School closed for Dashain festival',
        },
        eventType: {
          type: 'string',
          example: 'HOLIDAY',
          enum: ['HOLIDAY', 'EXAM', 'EVENT', 'ACTIVITY'],
        },
        startDate: { type: 'string', example: '2081-07-15' },
        endDate: { type: 'string', example: '2081-07-30' },
        classId: { type: 'number', example: 10 },
        isForAll: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Dashain Vacation' },
        message: { type: 'string', example: 'Event created successfully' },
      },
    },
  })
  create(@Body() dto: CreateCalendarEventDto) {
    return this.calendarService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get All Calendar Events',
    description: `Retrieve all calendar events for a school.

**Query Parameters:**
- schoolId: Required for filtering
- academicYear: Optional filter by academic year

**Returns:**
- All events sorted by date`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year (optional)',
    example: '2081-2082',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar events',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'Dashain Vacation' },
          eventType: { type: 'string', example: 'HOLIDAY' },
          startDate: { type: 'string', example: '2081-07-15' },
          endDate: { type: 'string', example: '2081-07-30' },
        },
      },
    },
  })
  findAll(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.calendarService.findAll(schoolId, academicYear);
  }

  @Get('holidays')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Holidays',
    description: `Retrieve all holidays for a school in an academic year.

**Returns:**
- Holiday list with dates
- Holiday types`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Holiday list',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'Dashain Vacation' },
          startDate: { type: 'string', example: '2081-07-15' },
          endDate: { type: 'string', example: '2081-07-30' },
        },
      },
    },
  })
  getHolidays(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.calendarService.getHolidays(schoolId, academicYear);
  }

  @Get('exams')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Exam Schedule',
    description: `Retrieve all exam events for a school.

**Returns:**
- Exam dates and times
- Classes involved`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Exam schedule',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'Terminal Exam' },
          examDate: { type: 'string', example: '2081-08-15' },
        },
      },
    },
  })
  getExams(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.calendarService.getExams(schoolId, academicYear);
  }

  @Get('events')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Events',
    description: `Retrieve all school events (non-holiday, non-exam).`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'academicYear',
    description: 'Academic year',
    example: '2081-2082',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Event list',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'Sports Day' },
          eventType: { type: 'string', example: 'EVENT' },
          startDate: { type: 'string', example: '2081-09-15' },
        },
      },
    },
  })
  getEvents(
    @Query('schoolId') schoolId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.calendarService.getEvents(schoolId, academicYear);
  }

  @Get('upcoming')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Upcoming Events',
    description: `Get upcoming events for the next N days.

**Query Parameters:**
- days: Number of days ahead (default: 7)`,
  })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'days',
    description: 'Days ahead',
    example: 7,
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming events',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'Sports Day' },
          eventDate: { type: 'string', example: '2081-09-15' },
          daysRemaining: { type: 'number', example: 5 },
        },
      },
    },
  })
  getUpcoming(
    @Query('schoolId') schoolId: number,
    @Query('days') days?: number,
  ) {
    return this.calendarService.getUpcoming(schoolId, days);
  }

  @Get('range')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Events by Date Range',
    description: `Get events within a specific date range.

**Query Parameters:**
- startDate: Start date
- endDate: End date`,
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
    required: true,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date',
    example: '2081-04-30',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Events in range',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'Parent Teacher Meeting' },
          eventDate: { type: 'string', example: '2081-04-15' },
        },
      },
    },
  })
  getByDateRange(
    @Query('schoolId') schoolId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.calendarService.getCalendarByDateRange(
      schoolId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_READ)
  @ApiOperation({
    summary: 'Get Calendar Event by ID',
    description: `Retrieve calendar event details by ID.`,
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1, type: Number })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Event details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'Dashain Vacation' },
        eventType: { type: 'string', example: 'HOLIDAY' },
        startDate: { type: 'string', example: '2081-07-15' },
        endDate: { type: 'string', example: '2081-07-30' },
        description: { type: 'string', example: 'School closed' },
      },
    },
  })
  findOne(@Param('id') id: number, @Query('schoolId') schoolId: number) {
    return this.calendarService.findById(id, schoolId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_UPDATE)
  @ApiOperation({
    summary: 'Update Calendar Event',
    description: `Update calendar event details.`,
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1, type: Number })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Event updated successfully' },
      },
    },
  })
  update(
    @Param('id') id: number,
    @Query('schoolId') schoolId: number,
    @Body() dto: Partial<CreateCalendarEventDto>,
  ) {
    return this.calendarService.update(id, schoolId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.ACADEMIC_UPDATE)
  @ApiOperation({
    summary: 'Delete Calendar Event',
    description: `Delete a calendar event. Cannot delete past events.`,
  })
  @ApiParam({ name: 'id', description: 'Event ID', example: 1, type: Number })
  @ApiQuery({
    name: 'schoolId',
    description: 'School ID',
    example: 1,
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Event deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Event deleted successfully' },
      },
    },
  })
  remove(@Param('id') id: number, @Query('schoolId') schoolId: number) {
    return this.calendarService.delete(id, schoolId);
  }
}
