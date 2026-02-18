import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { StudentStatsDto } from './dto/student-stats.dto';
import { TeacherStatsDto } from './dto/teacher-stats.dto';
import { AccountantStatsDto } from './dto/accountant-stats.dto';
import { ParentStatsDto } from './dto/parent-stats.dto';

@ApiTags('Dashboard Statistics')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get Admin dashboard statistics' })
  @ApiResponse({ status: 200, type: AdminStatsDto })
  async getAdminStats(@GetUser('schoolId') schoolId: number) {
    return this.dashboardService.getAdminStats(schoolId);
  }

  @Get('student')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get Student dashboard statistics' })
  @ApiResponse({ status: 200, type: StudentStatsDto })
  async getStudentStats(
    @GetUser('schoolId') schoolId: number,
    @Query('studentId', new ParseIntPipe({ optional: true }))
    studentId?: number,
  ) {
    // In a real scenario, we'd link user to student. For now, using query param if provided.
    // If not provided, we might need a way to find the student ID from userId.
    return this.dashboardService.getStudentStats(schoolId, studentId || 0);
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get Teacher dashboard statistics' })
  @ApiResponse({ status: 200, type: TeacherStatsDto })
  async getTeacherStats(
    @GetUser('schoolId') schoolId: number,
    @Query('teacherId', new ParseIntPipe({ optional: true }))
    teacherId?: number,
  ) {
    return this.dashboardService.getTeacherStats(schoolId, teacherId || 0);
  }

  @Get('accountant')
  @Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get Accountant dashboard statistics' })
  @ApiResponse({ status: 200, type: AccountantStatsDto })
  async getAccountantStats(@GetUser('schoolId') schoolId: number) {
    return this.dashboardService.getAccountantStats(schoolId);
  }

  @Get('parent')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Get Parent dashboard statistics' })
  @ApiResponse({ status: 200, type: ParentStatsDto })
  async getParentStats(
    @GetUser('schoolId') schoolId: number,
    @GetUser('userId') userId: number,
  ) {
    return this.dashboardService.getParentStats(schoolId, userId);
  }
}
