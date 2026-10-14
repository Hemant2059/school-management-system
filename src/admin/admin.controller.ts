import { Controller, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permissions } from '../common/decorators/roles.decorator';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Admin & Data Management')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('export')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_EXPORT)
  @ApiOperation({
    summary: 'Export School Data',
    description: `Export all school data for backup purposes.
    
    **Includes:**
    - Students, Guardians, Teachers
    - Fees and Payments
    - Attendance records
    - Exam marks and results
    
    **Note:** This is a read-only export. For restore, contact support.`,
  })
  @ApiQuery({ name: 'schoolId', required: true, type: Number })
  @ApiQuery({
    name: 'tables',
    required: false,
    type: String,
    description: 'Comma-separated table names',
  })
  exportData(
    @Query('schoolId') schoolId: number,
    @Query('tables') tables?: string,
  ) {
    const tableList = tables ? tables.split(',') : undefined;
    return this.adminService.exportData(schoolId, tableList);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.REPORT_GENERATE)
  @ApiOperation({
    summary: 'Get Database Statistics',
    description:
      'Get record counts for all major tables in the school database.',
  })
  @ApiQuery({ name: 'schoolId', required: true, type: Number })
  getStats(@Query('schoolId') schoolId: number) {
    return this.adminService.getDatabaseStats(schoolId);
  }

  @Get('schema/:table')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get Table Schema' })
  getTableSchema(@Param('table') tableName: string) {
    return this.adminService.getTableSchema(tableName);
  }
}
