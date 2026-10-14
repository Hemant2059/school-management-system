import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RbacService } from '../database/rbac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/roles.guard';
import { Permissions, Permission } from '../common/decorators/roles.decorator';

/**
 * Dynamic RBAC administration. All routes require role:manage (held by
 * ADMIN templates; delegable to custom roles). Tenant isolation is enforced
 * by RLS on every write plus the request tenant scope — cross-school
 * role/grant operations fail closed.
 */
@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(Permission.ROLE_MANAGE)
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('permissions')
  @ApiOperation({ summary: 'List the global permission catalog' })
  @ApiResponse({ status: 200, description: 'Permission catalog' })
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @Get('roles')
  @ApiOperation({ summary: 'List school roles (custom + system templates)' })
  @ApiQuery({ name: 'schoolId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Role list' })
  listRoles(@Query('schoolId', ParseIntPipe) schoolId: number) {
    return this.rbac.listRoles(schoolId);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get a role with its granted permissions' })
  getRole(
    @Param('id', ParseIntPipe) id: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
  ) {
    return this.rbac.getRole(id, schoolId);
  }

  @Post('roles')
  @ApiOperation({
    summary: 'Create a custom school role, optionally cloning a template',
  })
  @ApiResponse({ status: 201, description: 'Role created' })
  createRole(
    @Body()
    dto: {
      schoolId: number;
      code: string;
      nameEn: string;
      nameNp?: string;
      copyFromRoleId?: number;
    },
  ) {
    return this.rbac.createRole(dto.schoolId, dto);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Rename or activate/deactivate a custom role' })
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      schoolId: number;
      nameEn?: string;
      nameNp?: string;
      isActive?: boolean;
    },
  ) {
    return this.rbac.updateRole(id, dto.schoolId, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete a custom role (system templates locked)' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
  ) {
    await this.rbac.deleteRole(id, schoolId);
    return { message: 'Role deleted successfully' };
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Grant a permission to a custom role' })
  grantPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { schoolId: number; code: string },
  ) {
    return this.rbac
      .grantPermission(id, dto.schoolId, dto.code)
      .then(() => ({ message: 'Permission granted' }));
  }

  @Delete('roles/:id/permissions/:code')
  @ApiOperation({ summary: 'Revoke a permission from a custom role' })
  async revokePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('code') code: string,
    @Query('schoolId', ParseIntPipe) schoolId: number,
  ) {
    await this.rbac.revokePermission(id, schoolId, code);
    return { message: 'Permission revoked' };
  }

  @Post('users/:userId/roles')
  @ApiOperation({ summary: 'Assign a role to a user in a school' })
  assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: { schoolId: number; roleId: number; assignedBy?: number },
  ) {
    return this.rbac
      .assignRole(userId, dto.roleId, dto.schoolId, dto.assignedBy)
      .then(() => ({ message: 'Role assigned' }));
  }

  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Revoke a role from a user in a school' })
  async revokeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
  ) {
    await this.rbac.revokeRole(userId, roleId, schoolId);
    return { message: 'Role revoked' };
  }

  @Get('users/:userId/permissions')
  @ApiOperation({ summary: "Inspect a user's effective permissions" })
  effectivePermissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
  ) {
    return this.rbac.getUserPermissions(userId, schoolId);
  }
}
