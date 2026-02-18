import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('School Management')
@ApiBearerAuth()
@Controller('schools')
@Roles(UserRole.ADMIN)
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new school',
    description:
      'Register a new school in the system. Only accessible by ADMIN users.',
  })
  @ApiResponse({
    status: 201,
    description: 'School created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'School code already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
  })
  create(
    @Body() createSchoolDto: CreateSchoolDto,
    @GetUser('userId') userId: number,
  ) {
    return this.schoolService.create(createSchoolDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all schools',
    description: 'Retrieve a list of all schools in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of schools retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          schoolName: {
            type: 'string',
            example: 'Everest Higher Secondary School',
          },
          schoolCode: { type: 'string', example: 'SCH-001' },
          schoolType: { type: 'string', example: 'DAY_BOARDING' },
          email: { type: 'string', example: 'info@everestschool.edu.np' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  findAll() {
    return this.schoolService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get school by ID',
    description: 'Retrieve detailed information about a specific school.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'School details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(+id);
  }

  @Get(':id/with-nepali-date')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get school with Nepali date',
    description:
      'Retrieve school information with establishment date converted to Nepali calendar (BS).',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'School details with Nepali date retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        schoolName: {
          type: 'string',
          example: 'Everest Higher Secondary School',
        },
        establishedDateBs: { type: 'string', example: '2057-01-01' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getWithNepaliDate(@Param('id') id: string) {
    return this.schoolService.getSchoolWithNepaliDate(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update school',
    description: 'Update school information. Only accessible by ADMIN users.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'School updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
  })
  update(
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @GetUser('userId') userId: number,
  ) {
    return this.schoolService.update(+id, updateSchoolDto, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete school',
    description:
      'Soft delete a school from the system. Only accessible by ADMIN users.',
  })
  @ApiParam({
    name: 'id',
    description: 'School ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'School deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'School not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  remove(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.schoolService.remove(+id, userId);
  }
}
