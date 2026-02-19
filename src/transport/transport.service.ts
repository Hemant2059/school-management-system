import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { AssignStudentDto } from './dto/assign-student.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

export interface Vehicle {
  vehicle_id: number;
  school_id: number;
  vehicle_number: string;
  vehicle_name: string;
  vehicle_type: string;
  capacity: number;
  manufacturer: string | null;
  year: number | null;
  color: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  insurance_expiry: Date | null;
  permit_expiry: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Route {
  route_id: number;
  school_id: number;
  route_name: string;
  route_code: string;
  province_id: number | null;
  district_id: number | null;
  municipality_id: number | null;
  route_description: string;
  distance_km: number;
  estimated_time: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface RouteStop {
  route_stop_id: number;
  school_id: number;
  route_id: number;
  stop_name: string;
  stop_order: number;
  latitude: number | null;
  longitude: number | null;
  pickup_time: string | null;
  drop_time: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransportAssignment {
  assignment_id: number;
  school_id: number;
  student_id: number;
  route_id: number;
  vehicle_id: number | null;
  assignment_date: Date;
  assignment_date_bs: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransportFee {
  fee_id: number;
  school_id: number;
  route_id: number;
  monthly_fee: number;
  admission_fee: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TransportService {
  constructor(private db: DatabaseService) {}

  async createVehicle(createDto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.db.queryOne<Vehicle>(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_number = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [createDto.vehicleNumber, createDto.schoolId],
    );
    if (existing) {
      throw new BadRequestException(
        'Vehicle with this number already exists at this school',
      );
    }

    const result = await this.db.insert<Vehicle>(
      `INSERT INTO vehicles (
        school_id, vehicle_number, vehicle_name, vehicle_type, capacity,
        manufacturer, year, color, chassis_number, engine_number,
        insurance_expiry, permit_expiry, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.vehicleNumber,
        createDto.vehicleName,
        createDto.vehicleType,
        createDto.capacity,
        createDto.manufacturer,
        createDto.year,
        createDto.color,
        createDto.chassisNumber,
        createDto.engineNumber,
        createDto.insuranceExpiry,
        createDto.permitExpiry,
        true,
      ],
    );
    return result;
  }

  async findAllVehicles(schoolId: number): Promise<Vehicle[]> {
    return this.db.query<Vehicle>(
      `SELECT * FROM vehicles WHERE school_id = $1 AND is_active = true AND deleted_at IS NULL`,
      [schoolId],
    );
  }

  async createRoute(createDto: CreateRouteDto): Promise<Route> {
    const result = await this.db.insert<Route>(
      `INSERT INTO routes (
        school_id, route_name, route_code, province_id, district_id, municipality_id,
        route_description, distance_km, estimated_time, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.routeName,
        createDto.routeCode,
        createDto.provinceId,
        createDto.districtId,
        createDto.municipalityId,
        createDto.routeDescription,
        createDto.distanceKm,
        createDto.estimatedTime,
        true,
      ],
    );
    return result;
  }

  async createRouteStop(createDto: CreateRouteStopDto): Promise<RouteStop> {
    const result = await this.db.insert<RouteStop>(
      `INSERT INTO route_stops (
        school_id, route_id, stop_name, stop_order, latitude, longitude,
        pickup_time, drop_time, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.routeId,
        createDto.stopName,
        createDto.stopOrder,
        createDto.latitude,
        createDto.longitude,
        createDto.arrivalTime,
        createDto.departureTime,
        true,
      ],
    );
    return result;
  }

  async getRouteWithStops(routeId: number, schoolId: number): Promise<any> {
    const route = await this.db.queryOne<Route>(
      `SELECT * FROM routes WHERE route_id = $1 AND school_id = $2 AND is_active = true AND deleted_at IS NULL`,
      [routeId, schoolId],
    );
    if (!route)
      throw new NotFoundException(`Route with ID ${routeId} not found`);

    const stops = await this.db.query<RouteStop>(
      `SELECT * FROM route_stops WHERE route_id = $1 AND school_id = $2 AND is_active = true ORDER BY stop_order ASC`,
      [routeId, schoolId],
    );

    return { ...route, stops };
  }

  async assignStudentToTransport(
    assignDto: AssignStudentDto,
  ): Promise<TransportAssignment> {
    const existing = await this.db.queryOne<TransportAssignment>(
      `SELECT assignment_id FROM transport_assignments 
       WHERE student_id = $1 AND school_id = $2 AND is_active = true`,
      [assignDto.studentId, assignDto.schoolId],
    );
    if (existing) {
      throw new BadRequestException(
        'Student already has an active transport assignment',
      );
    }

    const bsDate = NepaliDateUtil.adToBs(assignDto.assignmentDate).bsDate;

    const result = await this.db.insert<TransportAssignment>(
      `INSERT INTO transport_assignments (
        school_id, student_id, route_id, vehicle_id, assignment_date, assignment_date_bs, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        assignDto.schoolId,
        assignDto.studentId,
        assignDto.routeId,
        assignDto.vehicleId,
        assignDto.assignmentDate,
        bsDate,
        true,
      ],
    );
    return result;
  }

  async getStudentTransport(
    studentId: number,
    schoolId: number,
  ): Promise<TransportAssignment> {
    const assignment = await this.db.queryOne<TransportAssignment>(
      `SELECT * FROM transport_assignments WHERE student_id = $1 AND school_id = $2 AND is_active = true`,
      [studentId, schoolId],
    );
    if (!assignment)
      throw new NotFoundException('No active transport assignment found');
    return assignment;
  }

  async setRouteFee(
    routeId: number,
    schoolId: number,
    monthlyFee: number,
    admissionFee?: number,
  ): Promise<TransportFee> {
    const fee = await this.db.queryOne<TransportFee>(
      `SELECT * FROM transport_fees WHERE route_id = $1 AND school_id = $2 AND is_active = true`,
      [routeId, schoolId],
    );

    if (fee) {
      await this.db.update(
        `UPDATE transport_fees SET monthly_fee = $1, admission_fee = $2 WHERE fee_id = $3`,
        [monthlyFee, admissionFee || fee.admission_fee, fee.fee_id],
      );
      const updated = await this.db.queryOne<TransportFee>(
        `SELECT * FROM transport_fees WHERE fee_id = $1`,
        [fee.fee_id],
      );
      if (!updated) throw new NotFoundException('Fee not found after update');
      return updated;
    }

    const result = await this.db.insert<TransportFee>(
      `INSERT INTO transport_fees (
        school_id, route_id, monthly_fee, admission_fee, currency, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [schoolId, routeId, monthlyFee, admissionFee || 0, 'NPR', true],
    );
    return result;
  }

  async getRouteFee(routeId: number, schoolId: number): Promise<any> {
    const fee = await this.db.queryOne<TransportFee>(
      `SELECT * FROM transport_fees WHERE route_id = $1 AND school_id = $2 AND is_active = true`,
      [routeId, schoolId],
    );
    if (!fee) throw new NotFoundException('No fee set for this route');

    return {
      ...fee,
      monthlyFeeNpr: NepaliNumberUtil.formatCurrency(fee.monthly_fee, 'en'),
      monthlyFeeNprNp: NepaliNumberUtil.formatCurrency(fee.monthly_fee, 'ne'),
      admissionFeeNpr: fee.admission_fee
        ? NepaliNumberUtil.formatCurrency(fee.admission_fee, 'en')
        : null,
      admissionFeeNprNp: fee.admission_fee
        ? NepaliNumberUtil.formatCurrency(fee.admission_fee, 'ne')
        : null,
    };
  }

  async getRoutesByDistrict(
    districtId: number,
    schoolId: number,
  ): Promise<Route[]> {
    return this.db.query<Route>(
      `SELECT * FROM routes WHERE district_id = $1 AND school_id = $2 AND is_active = true AND deleted_at IS NULL ORDER BY route_name ASC`,
      [districtId, schoolId],
    );
  }

  async getRouteAssignments(
    routeId: number,
    schoolId: number,
  ): Promise<TransportAssignment[]> {
    return this.db.query<TransportAssignment>(
      `SELECT * FROM transport_assignments WHERE route_id = $1 AND school_id = $2 AND is_active = true ORDER BY created_at DESC`,
      [routeId, schoolId],
    );
  }
}
