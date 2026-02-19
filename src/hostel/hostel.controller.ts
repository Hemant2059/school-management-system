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
import { HostelService } from './hostel.service';
import type {
  CreateHostelDto,
  CreateRoomDto,
  AssignStudentDto,
  Hostel,
  Room,
  HostelStudent,
} from './hostel.service';
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

@ApiTags('Hostel Management')
@ApiBearerAuth()
@Controller('hostels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Create hostel',
    description: 'Create a new hostel/building in the system.',
  })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 201,
    description: 'Hostel created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async createHostel(
    @Body() dto: CreateHostelDto,
    @Req() req,
  ): Promise<Hostel> {
    return this.hostelService.createHostel(req.user.schoolId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all hostels',
    description: 'Retrieve list of all hostels for the school.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of hostels retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHostels(@Req() req): Promise<Hostel[]> {
    return this.hostelService.getHostels(req.user.schoolId);
  }

  @Get('statistics')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get hostel statistics',
    description: 'Retrieve occupancy statistics for all hostels.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hostel statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getHostelStatistics(@Req() req) {
    return this.hostelService.getHostelStatistics(req.user.schoolId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get hostel by ID',
    description: 'Retrieve detailed information about a specific hostel.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hostel ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Hostel details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Hostel not found' })
  async getHostelById(@Param('id') id: number, @Req() req): Promise<Hostel> {
    return this.hostelService.getHostelById(id, req.user.schoolId);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update hostel',
    description: 'Update hostel information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hostel ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 200,
    description: 'Hostel updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Hostel not found' })
  async updateHostel(
    @Param('id') id: number,
    @Body() dto: Partial<CreateHostelDto>,
    @Req() req,
  ): Promise<Hostel> {
    return this.hostelService.updateHostel(id, req.user.schoolId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete hostel',
    description: 'Remove a hostel from the system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hostel ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Hostel deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Hostel not found' })
  async deleteHostel(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.hostelService.deleteHostel(id, req.user.schoolId);
    return { message: 'Hostel deleted successfully' };
  }

  @Post('rooms')
  @Roles('admin')
  @ApiOperation({
    summary: 'Create room',
    description: 'Add a new room to a hostel.',
  })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 201,
    description: 'Room created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async createRoom(@Body() dto: CreateRoomDto): Promise<Room> {
    return this.hostelService.createRoom(dto);
  }

  @Get('rooms')
  @ApiOperation({
    summary: 'Get rooms by hostel',
    description: 'Retrieve all rooms for a specific hostel.',
  })
  @ApiQuery({
    name: 'hostelId',
    description: 'Hostel ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of rooms retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRooms(@Query('hostelId') hostelId: number): Promise<Room[]> {
    return this.hostelService.getRooms(hostelId);
  }

  @Post('students')
  @Roles('admin')
  @ApiOperation({
    summary: 'Assign student to hostel',
    description: 'Assign a student to a specific room in a hostel.',
  })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 201,
    description: 'Student assigned to hostel successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async assignStudent(
    @Body() dto: AssignStudentDto,
    @Req() req,
  ): Promise<HostelStudent> {
    return this.hostelService.assignStudent(req.user.schoolId, dto);
  }

  @Get('students')
  @Roles('admin', 'student')
  @ApiOperation({
    summary: 'Get hostel students',
    description: 'Retrieve list of students assigned to a specific hostel.',
  })
  @ApiQuery({
    name: 'hostelId',
    description: 'Hostel ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of hostel students retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHostelStudents(@Query('hostelId') hostelId: number, @Req() req) {
    return this.hostelService.getHostelStudents(req.user.schoolId, hostelId);
  }

  @Put('students/:id/checkout')
  @Roles('admin')
  @ApiOperation({
    summary: 'Check out student from hostel',
    description: 'Record student checkout from hostel with checkout date.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hostel student assignment ID',
    example: 1,
    type: Number,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        checkOutDate: {
          type: 'string',
          description: 'Checkout date (YYYY-MM-DD)',
          example: '2024-12-01',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Student checked out successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Hostel student not found' })
  async checkOutStudent(
    @Param('id') id: number,
    @Body() body: { checkOutDate: string },
    @Req() req,
  ): Promise<HostelStudent> {
    return this.hostelService.checkOutStudent(
      id,
      req.user.schoolId,
      body.checkOutDate,
    );
  }
}
