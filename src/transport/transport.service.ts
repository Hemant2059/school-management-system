import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { TransportAssignment } from './entities/transport-assignment.entity';
import { TransportFee } from './entities/transport-fee.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private routeStopRepository: Repository<RouteStop>,
    @InjectRepository(TransportAssignment)
    private assignmentRepository: Repository<TransportAssignment>,
    @InjectRepository(TransportFee)
    private feeRepository: Repository<TransportFee>,
  ) {}

  // Vehicle Management
  async createVehicle(createDto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehicleRepository.findOne({
      where: {
        vehicleNumber: createDto.vehicleNumber,
        schoolId: createDto.schoolId,
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Vehicle with this number already exists at this school',
      );
    }

    const vehicle = this.vehicleRepository.create({
      ...createDto,
      schoolId: createDto.schoolId,
    });
    return this.vehicleRepository.save(vehicle);
  }

  async findAllVehicles(schoolId: number): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { schoolId, isActive: true, deletedAt: IsNull() },
    });
  }

  // Route Management
  async createRoute(createDto: CreateRouteDto): Promise<Route> {
    const route = this.routeRepository.create({
      ...createDto,
      schoolId: createDto.schoolId,
    });
    return this.routeRepository.save(route);
  }

  async createRouteStop(createDto: CreateRouteStopDto): Promise<RouteStop> {
    const routeStop = this.routeStopRepository.create({
      ...createDto,
      schoolId: createDto.schoolId,
    });
    return this.routeStopRepository.save(routeStop);
  }

  async getRouteWithStops(routeId: number, schoolId: number): Promise<any> {
    const route = await this.routeRepository.findOne({
      where: { routeId, schoolId, isActive: true, deletedAt: IsNull() },
    });
    if (!route)
      throw new NotFoundException(`Route with ID ${routeId} not found`);

    const stops = await this.routeStopRepository.find({
      where: { routeId, schoolId, isActive: true },
      order: { stopOrder: 'ASC' },
    });

    return { ...route, stops };
  }

  // Student Assignment
  async assignStudentToTransport(
    assignDto: AssignStudentDto,
  ): Promise<TransportAssignment> {
    // Check if student already has active assignment
    const existing = await this.assignmentRepository.findOne({
      where: {
        studentId: assignDto.studentId,
        schoolId: assignDto.schoolId,
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Student already has an active transport assignment',
      );
    }

    const bsDate = NepaliDateUtil.adToBs(assignDto.assignmentDate).bsDate;

    const assignment = this.assignmentRepository.create({
      ...assignDto,
      schoolId: assignDto.schoolId,
      assignmentDateBs: bsDate,
      isActive: true,
    });

    return this.assignmentRepository.save(assignment);
  }

  async getStudentTransport(
    studentId: number,
    schoolId: number,
  ): Promise<TransportAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { studentId, schoolId, isActive: true },
    });
    if (!assignment)
      throw new NotFoundException('No active transport assignment found');
    return assignment;
  }

  // Fee Management (NPR Format)
  async setRouteFee(
    routeId: number,
    schoolId: number,
    monthlyFee: number,
    admissionFee?: number,
  ): Promise<TransportFee> {
    // Check if fee already exists for this route
    let fee = await this.feeRepository.findOne({
      where: { routeId, schoolId, isActive: true },
    });

    if (fee) {
      fee.monthlyFee = monthlyFee;
      fee.admissionFee = admissionFee || fee.admissionFee;
      return this.feeRepository.save(fee);
    }

    fee = this.feeRepository.create({
      routeId,
      schoolId,
      monthlyFee,
      admissionFee: admissionFee || 0,
      currency: 'NPR',
      isActive: true,
    });

    return this.feeRepository.save(fee);
  }

  async getRouteFee(routeId: number, schoolId: number): Promise<any> {
    const fee = await this.feeRepository.findOne({
      where: { routeId, schoolId, isActive: true },
    });
    if (!fee) throw new NotFoundException('No fee set for this route');

    return {
      ...fee,
      monthlyFeeNpr: NepaliNumberUtil.formatCurrency(fee.monthlyFee, 'en'),
      monthlyFeeNprNp: NepaliNumberUtil.formatCurrency(fee.monthlyFee, 'ne'),
      admissionFeeNpr: fee.admissionFee
        ? NepaliNumberUtil.formatCurrency(fee.admissionFee, 'en')
        : null,
      admissionFeeNprNp: fee.admissionFee
        ? NepaliNumberUtil.formatCurrency(fee.admissionFee, 'ne')
        : null,
    };
  }

  // Nepal-specific: Get routes by district
  async getRoutesByDistrict(
    districtId: number,
    schoolId: number,
  ): Promise<Route[]> {
    return this.routeRepository.find({
      where: { districtId, schoolId, isActive: true, deletedAt: IsNull() },
      order: { routeName: 'ASC' },
    });
  }

  // Get all active assignments for a route
  async getRouteAssignments(
    routeId: number,
    schoolId: number,
  ): Promise<TransportAssignment[]> {
    return this.assignmentRepository.find({
      where: { routeId, schoolId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
