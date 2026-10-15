import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PlatformService } from './platform.service';

@ApiTags('Platform Administration')
@ApiBearerAuth()
@Controller('platform')
@Roles(UserRole.SUPER_ADMIN)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Cross-school overview',
    description:
      'Platform-level stats per school (students, teachers, invoices, attendance). SUPER_ADMIN only; no school context required.',
  })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Super-admin only' })
  getOverview() {
    return this.platformService.getOverview();
  }
}
