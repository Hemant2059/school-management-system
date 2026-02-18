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
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GuardianService } from './guardian.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@ApiTags('Guardian Management')
@ApiBearerAuth()
@Controller('guardians')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post()
  @ApiOperation({
    summary: 'Create new guardian',
    description:
      'Register a new guardian/parent in the system with bilingual support.',
  })
  @ApiResponse({
    status: 201,
    description: 'Guardian created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Mobile number already exists',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
  })
  create(
    @Body() createGuardianDto: CreateGuardianDto,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.create({ ...createGuardianDto, schoolId });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all guardians',
    description: 'Retrieve a list of all registered guardians.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of guardians retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser('schoolId') schoolId: number) {
    return this.guardianService.findAll(schoolId);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search guardians',
    description: 'Search guardians by name, mobile number, or email.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (name, mobile, or email)',
    example: 'Ram',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  search(@Query('q') query: string, @GetUser('schoolId') schoolId: number) {
    return this.guardianService.searchGuardians(schoolId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get guardian by ID',
    description: 'Retrieve detailed information about a specific guardian.',
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
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.findOne(id, schoolId);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get guardian with full details',
    description:
      'Retrieve guardian information including associated students and relationships.',
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
  @ApiOperation({
    summary: 'Find guardian by mobile number',
    description: 'Search for a guardian using their mobile number.',
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
  })
  @ApiResponse({
    status: 404,
    description: 'Guardian not found',
  })
  findByMobile(
    @Param('mobile') mobile: string,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.guardianService.findByMobile(mobile, schoolId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update guardian',
    description: 'Update guardian information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Guardian ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Guardian updated successfully',
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
  @ApiOperation({
    summary: 'Delete guardian',
    description: 'Soft delete a guardian from the system.',
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
