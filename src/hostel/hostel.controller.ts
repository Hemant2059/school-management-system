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

@Controller('hostels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Post()
  @Roles('admin')
  async createHostel(
    @Body() dto: CreateHostelDto,
    @Req() req,
  ): Promise<Hostel> {
    return this.hostelService.createHostel(req.user.schoolId, dto);
  }

  @Get()
  async getHostels(@Req() req): Promise<Hostel[]> {
    return this.hostelService.getHostels(req.user.schoolId);
  }

  @Get('statistics')
  @Roles('admin')
  async getHostelStatistics(@Req() req) {
    return this.hostelService.getHostelStatistics(req.user.schoolId);
  }

  @Get(':id')
  async getHostelById(@Param('id') id: number, @Req() req): Promise<Hostel> {
    return this.hostelService.getHostelById(id, req.user.schoolId);
  }

  @Put(':id')
  @Roles('admin')
  async updateHostel(
    @Param('id') id: number,
    @Body() dto: Partial<CreateHostelDto>,
    @Req() req,
  ): Promise<Hostel> {
    return this.hostelService.updateHostel(id, req.user.schoolId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteHostel(
    @Param('id') id: number,
    @Req() req,
  ): Promise<{ message: string }> {
    await this.hostelService.deleteHostel(id, req.user.schoolId);
    return { message: 'Hostel deleted successfully' };
  }

  @Post('rooms')
  @Roles('admin')
  async createRoom(@Body() dto: CreateRoomDto): Promise<Room> {
    return this.hostelService.createRoom(dto);
  }

  @Get('rooms')
  async getRooms(@Query('hostelId') hostelId: number): Promise<Room[]> {
    return this.hostelService.getRooms(hostelId);
  }

  @Post('students')
  @Roles('admin')
  async assignStudent(
    @Body() dto: AssignStudentDto,
    @Req() req,
  ): Promise<HostelStudent> {
    return this.hostelService.assignStudent(req.user.schoolId, dto);
  }

  @Get('students')
  @Roles('admin', 'student')
  async getHostelStudents(@Query('hostelId') hostelId: number, @Req() req) {
    return this.hostelService.getHostelStudents(req.user.schoolId, hostelId);
  }

  @Put('students/:id/checkout')
  @Roles('admin')
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
