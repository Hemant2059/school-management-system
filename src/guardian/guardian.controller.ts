import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { GuardianService } from './guardian.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Permission } from '../common/decorators/roles.decorator';

@ApiTags('Guardian Management')
@ApiBearerAuth()
@Controller('guardians')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.GUARDIAN_CREATE)
  @ApiOperation({
    summary: 'Create New Guardian',
    description: `Register a new guardian/parent in the system with comprehensive details.

**Features:**
- Bilingual name support (English & Nepali)
- Multiple contact methods (mobile, email, phone)
- Occupation and income details
- Address with Nepal-specific fields
- Multiple children can be linked

**Note:** Each mobile number must be unique in the system.`,
  })
  @ApiBody({
    description: 'Guardian creation data',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'श्याम' },
        firstNameEn: { type: 'string', example: 'Shyam' },
        lastName: { type: 'string', example: 'शर्मा' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'guardian@email.com' },
        phone: { type: 'string', example: '01-4567890' },
        gender: {
          type: 'string',
          example: 'MALE',
          enum: ['MALE', 'FEMALE', 'OTHER'],
        },
        occupation: { type: 'string', example: 'Business' },
        relation: {
          type: 'string',
          example: 'FATHER',
          enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Guardian created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Shyam' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        relation: { type: 'string', example: 'FATHER' },
        message: { type: 'string', example: 'Guardian created successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mobile number already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Mobile number already exists' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 422 },
        message: { type: 'string', example: 'Validation failed' },
      },
    },
  })
  create(
    @Body() createGuardianDto: CreateGuardianDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.create({ ...createGuardianDto, schoolId });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.GUARDIAN_READ)
  @ApiOperation({
    summary: 'Get All Guardians',
    description: `Retrieve list of all registered guardians for a school.

**Query Parameters:**
- relation: Filter by relation (FATHER, MOTHER, GUARDIAN)
- search: Search by name or mobile number

**Note:** Results are sorted by first name by default.`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of guardians retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          firstNameEn: { type: 'string', example: 'Shyam' },
          lastNameEn: { type: 'string', example: 'Sharma' },
          mobile: { type: 'string', example: '9841234567' },
          relation: { type: 'string', example: 'FATHER' },
          occupation: { type: 'string', example: 'Business' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser('schoolId') schoolId: number) {
    return this.guardianService.findAll(schoolId);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.GUARDIAN_READ)
  @ApiOperation({
    summary: 'Search Guardians',
    description: `Search guardians by name, mobile number, or email.

**Search Fields:**
- First name (English/Nepali)
- Last name (English/Nepali)
- Mobile number
- Email

**Use Case:** Quick guardian lookup during admission, fee collection, etc.`,
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (name, mobile, or email)',
    example: 'Sharma',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          firstNameEn: { type: 'string', example: 'Shyam' },
          lastNameEn: { type: 'string', example: 'Sharma' },
          mobile: { type: 'string', example: '9841234567' },
          relation: { type: 'string', example: 'FATHER' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Query('q') query: string, @GetUser('schoolId') schoolId: number) {
    return this.guardianService.searchGuardians(schoolId, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.GUARDIAN_READ)
  @ApiOperation({
    summary: 'Get Guardian by ID',
    description: `Retrieve detailed information about a specific guardian.

**Returns:**
- Basic personal details
- Contact information
- Occupation details
- Associated students`,
  })
  @ApiParam({
    name: 'id',
    description: 'Guardian ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Guardian details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Shyam' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'guardian@email.com' },
        relation: { type: 'string', example: 'FATHER' },
        occupation: { type: 'string', example: 'Business' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Guardian not found' },
      },
    },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.findOne(id, schoolId);
  }

  @Get(':id/details')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.GUARDIAN_READ)
  @ApiOperation({
    summary: 'Get Guardian with Full Details',
    description: `Retrieve guardian information including associated students and relationships.

**Includes:**
- Personal details (bilingual)
- Contact information
- Occupation details
- All linked students with relationship type
- Student academic details

**Use Case:** Complete guardian profile view, emergency contact retrieval.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Guardian ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Guardian full details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Shyam' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        email: { type: 'string', example: 'guardian@email.com' },
        relation: { type: 'string', example: 'FATHER' },
        occupation: { type: 'string', example: 'Business' },
        students: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              firstNameEn: { type: 'string', example: 'Ram' },
              lastNameEn: { type: 'string', example: 'Sharma' },
              admissionNumber: { type: 'string', example: 'ADM-2024-0001' },
              class: { type: 'string', example: 'Grade 10' },
              relationType: { type: 'string', example: 'PRIMARY' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
  })
  getDetails(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.getGuardianWithDetails(id, schoolId);
  }

  @Get('mobile/:mobile')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.GUARDIAN_READ)
  @ApiOperation({
    summary: 'Find Guardian by Mobile Number',
    description: `Search for a guardian using their mobile number.

**Use Cases:**
- Quick guardian lookup during phone inquiry
- Parent portal login verification
- Emergency contact search`,
  })
  @ApiParam({
    name: 'mobile',
    description: 'Mobile number (10 digits)',
    type: String,
    example: '9841234567',
  })
  @ApiResponse({
    status: 200,
    description: 'Guardian found',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        firstNameEn: { type: 'string', example: 'Shyam' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        mobile: { type: 'string', example: '9841234567' },
        relation: { type: 'string', example: 'FATHER' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Guardian not found' },
      },
    },
  })
  findByMobile(
    @Param('mobile') mobile: string,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.findByMobile(mobile, schoolId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.GUARDIAN_UPDATE)
  @ApiOperation({
    summary: 'Update Guardian',
    description: `Update guardian information.

**Note:** All fields are optional. Only provide fields that need updating.

**Restrictions:**
- Cannot change mobile number if already linked to another guardian
- Changes are logged for audit purposes`,
  })
  @ApiParam({
    name: 'id',
    description: 'Guardian ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    description: 'Guardian update data',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'श्याम' },
        firstNameEn: { type: 'string', example: 'Shyam' },
        lastName: { type: 'string', example: 'शर्मा' },
        lastNameEn: { type: 'string', example: 'Sharma' },
        email: { type: 'string', example: 'guardian@email.com' },
        phone: { type: 'string', example: '01-4567890' },
        occupation: { type: 'string', example: 'Business' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Guardian updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Guardian updated successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateGuardianDto: UpdateGuardianDto,
  ) {
    return this.guardianService.update(id, schoolId, updateGuardianDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.GUARDIAN_UPDATE)
  @ApiOperation({
    summary: 'Delete Guardian',
    description: `Soft delete a guardian from the system.

**Note:**
- Does not permanently remove data
- Guardian is marked as inactive
- All student-guardian links are preserved
- Can be reversed by admin

**Important:** Cannot delete guardian linked to active students without first unlinking.`,
  })
  @ApiParam({
    name: 'id',
    description: 'Guardian ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Guardian deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Guardian deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.remove(id, schoolId);
  }
}
