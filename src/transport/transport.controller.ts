import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@ApiTags('Transport Management')
@ApiBearerAuth()
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // Vehicles
  @Post('vehicles')
  @ApiOperation({
    summary: 'Add new vehicle',
    description: 'Register a new vehicle in the transport system.',
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({
    status: 201,
    description: 'Vehicle added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createVehicle(@Body() createDto: CreateVehicleDto) {
    return this.transportService.createVehicle(createDto);
  }

  @Get('vehicles')
  @ApiOperation({
    summary: 'Get all vehicles',
    description: 'Retrieve list of all transport vehicles.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllVehicles(@GetUser('schoolId') schoolId: number) {
    return this.transportService.findAllVehicles(schoolId);
  }

  @Patch('vehicles/:id')
  @ApiOperation({
    summary: 'Update vehicle',
    description:
      'Update vehicle details. Names and dates stored in English + Nepali as sent by frontend.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateVehicleDto,
  ) {
    return this.transportService.updateVehicle(id, schoolId, updateDto);
  }

  // Routes
  @Post('routes')
  @ApiOperation({
    summary: 'Create transport route',
    description: 'Create a new transport route.',
  })
  @ApiBody({ type: CreateRouteDto })
  @ApiResponse({
    status: 201,
    description: 'Route created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createRoute(@Body() createDto: CreateRouteDto) {
    return this.transportService.createRoute(createDto);
  }

  @Patch('routes/:id')
  @ApiOperation({
    summary: 'Update transport route',
    description:
      'Update route details. Names and points stored in English + Nepali as sent by frontend.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRouteDto })
  @ApiResponse({ status: 200, description: 'Route updated successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  updateRoute(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateRouteDto,
  ) {
    return this.transportService.updateRoute(id, schoolId, updateDto);
  }

  @Post('routes/stops')
  @ApiOperation({
    summary: 'Add route stop',
    description: 'Add a pickup/drop stop to an existing route.',
  })
  @ApiBody({ type: CreateRouteStopDto })
  @ApiResponse({
    status: 201,
    description: 'Route stop added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createRouteStop(@Body() createDto: CreateRouteStopDto) {
    return this.transportService.createRouteStop(createDto);
  }

  @Get('routes/:routeId')
  @ApiOperation({
    summary: 'Get route with stops',
    description: 'Retrieve route details including all stops.',
  })
  @ApiParam({
    name: 'routeId',
    description: 'Route ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Route with stops retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  getRouteWithStops(
    @Param('routeId', ParseIntPipe) routeId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.transportService.getRouteWithStops(routeId, schoolId);
  }

  @Get('routes/district/:districtId')
  @ApiOperation({
    summary: 'Get routes by district',
    description: 'Retrieve all routes operating in a specific district.',
  })
  @ApiParam({
    name: 'districtId',
    description: 'District ID',
    example: 27,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Routes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getRoutesByDistrict(
    @Param('districtId', ParseIntPipe) districtId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.transportService.getRoutesByDistrict(districtId, schoolId);
  }

  // Student Assignment
  @Post('assignments')
  @ApiOperation({
    summary: 'Assign student to transport',
    description: 'Assign a student to a specific route and stop.',
  })
  @ApiBody({ type: AssignStudentDto })
  @ApiResponse({
    status: 201,
    description: 'Student assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  assignStudent(@Body() assignDto: AssignStudentDto) {
    return this.transportService.assignStudentToTransport(assignDto);
  }

  @Get('assignments/student/:studentId')
  @ApiOperation({
    summary: 'Get student transport assignment',
    description: 'Retrieve transport assignment details for a student.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student transport details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Student not found or not assigned to transport',
  })
  getStudentTransport(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.transportService.getStudentTransport(studentId, schoolId);
  }

  @Get('assignments/route/:routeId')
  @ApiOperation({
    summary: 'Get route assignments',
    description: 'Retrieve all student assignments for a specific route.',
  })
  @ApiParam({
    name: 'routeId',
    description: 'Route ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Route assignments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getRouteAssignments(
    @Param('routeId', ParseIntPipe) routeId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.transportService.getRouteAssignments(routeId, schoolId);
  }

  // Fees
  @Post('fees')
  @ApiOperation({
    summary: 'Set route fee',
    description: 'Set monthly and admission fees for a transport route.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        routeId: {
          type: 'number',
          description: 'Route ID',
          example: 1,
        },
        monthlyFee: {
          type: 'number',
          description: 'Monthly transport fee in NPR',
          example: 2000,
        },
        admissionFee: {
          type: 'number',
          description: 'One-time admission fee in NPR (optional)',
          example: 500,
        },
      },
      required: ['routeId', 'monthlyFee'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Route fee set successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  setRouteFee(
    @Body('routeId') routeId: number,
    @GetUser('schoolId') schoolId: number,
    @Body('monthlyFee') monthlyFee: number,
    @Body('admissionFee') admissionFee?: number,
  ) {
    return this.transportService.setRouteFee(
      routeId,
      schoolId,
      monthlyFee,
      admissionFee,
    );
  }

  @Get('fees/route/:routeId')
  @ApiOperation({
    summary: 'Get route fee',
    description: 'Retrieve fee structure for a specific route.',
  })
  @ApiParam({
    name: 'routeId',
    description: 'Route ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Route fee retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Route fee not found' })
  getRouteFee(
    @Param('routeId', ParseIntPipe) routeId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.transportService.getRouteFee(routeId, schoolId);
  }
}
