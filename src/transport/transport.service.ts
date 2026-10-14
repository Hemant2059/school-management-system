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
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

export interface Vehicle {
  vehicle_id: number;
  school_id: number;
  transport_id: number | null;
  vehicle_number: string;
  vehicle_name: string;
  vehicle_name_np: string | null;
  vehicle_type: string;
  vehicle_type_np: string | null;
  capacity: number;
  manufacturer: string | null;
  manufacturer_np: string | null;
  year: number | null;
  color: string | null;
  color_np: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  insurance_expiry: Date | null;
  insurance_expiry_bs: string | null;
  permit_expiry: Date | null;
  permit_expiry_bs: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Route {
  route_id: number;
  school_id: number;
  route_name: string;
  route_name_np: string | null;
  route_code: string;
  province_id: number | null;
  district_id: number | null;
  municipality_id: number | null;
  route_description: string;
  route_description_np: string | null;
  start_point: string | null;
  start_point_np: string | null;
  end_point: string | null;
  end_point_np: string | null;
  distance_km: number;
  estimated_time: string | null;
  estimated_time_np: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface RouteStop {
  stop_id: number;
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
  id: number;
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
  id: number;
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
        school_id, transport_id, vehicle_number, vehicle_name, vehicle_name_np, vehicle_type, vehicle_type_np, capacity,
        manufacturer, manufacturer_np, year, color, color_np, chassis_number, engine_number,
        insurance_expiry, insurance_expiry_bs, permit_expiry, permit_expiry_bs, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.transportId || null,
        createDto.vehicleNumber,
        createDto.vehicleName,
        createDto.vehicleNameNp ?? null,
        createDto.vehicleType,
        createDto.vehicleTypeNp ?? null,
        createDto.capacity,
        createDto.manufacturer || null,
        createDto.manufacturerNp ?? null,
        createDto.year || null,
        createDto.color || null,
        createDto.colorNp ?? null,
        createDto.chassisNumber || null,
        createDto.engineNumber || null,
        createDto.insuranceExpiry || null,
        createDto.insuranceExpiryBs ?? null,
        createDto.permitExpiry || null,
        createDto.permitExpiryBs ?? null,
        true,
      ],
    );
    return result;
  }

  async updateVehicle(
    id: number,
    schoolId: number,
    updateDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const existing = await this.db.queryOne<Vehicle>(
      `SELECT * FROM vehicles WHERE vehicle_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, schoolId],
    );
    if (!existing) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    const fieldMap: Record<string, string> = {
      vehicleName: 'vehicle_name',
      vehicleNameNp: 'vehicle_name_np',
      vehicleType: 'vehicle_type',
      vehicleTypeNp: 'vehicle_type_np',
      capacity: 'capacity',
      manufacturer: 'manufacturer',
      manufacturerNp: 'manufacturer_np',
      year: 'year',
      color: 'color',
      colorNp: 'color_np',
      chassisNumber: 'chassis_number',
      engineNumber: 'engine_number',
      insuranceExpiry: 'insurance_expiry',
      insuranceExpiryBs: 'insurance_expiry_bs',
      permitExpiry: 'permit_expiry',
      permitExpiryBs: 'permit_expiry_bs',
      isActive: 'is_active',
    };
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      const v = (updateDto as any)[key];
      if (v !== undefined) {
        updates.push(`${col} = $${i++}`);
        params.push(v);
      }
    }
    if (updates.length === 0) return existing;
    params.push(id);
    return this.db.insert<Vehicle>(
      `UPDATE vehicles SET ${updates.join(', ')} WHERE vehicle_id = $${i} RETURNING *`,
      params,
    );
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
        school_id, route_name, route_name_np, route_code, province_id, district_id, municipality_id,
        route_description, route_description_np, start_point, start_point_np, end_point, end_point_np, distance_km, estimated_time, estimated_time_np, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.routeName,
        createDto.routeNameNp ?? null,
        createDto.routeCode,
        createDto.provinceId,
        createDto.districtId,
        createDto.municipalityId,
        createDto.routeDescription,
        createDto.routeDescriptionNp ?? null,
        createDto.startPoint ?? null,
        createDto.startPointNp ?? null,
        createDto.endPoint ?? null,
        createDto.endPointNp ?? null,
        createDto.distanceKm,
        createDto.estimatedTime,
        createDto.estimatedTimeNp ?? null,
        true,
      ],
    );
    return result;
  }

  async updateRoute(
    id: number,
    schoolId: number,
    updateDto: UpdateRouteDto,
  ): Promise<Route> {
    const existing = await this.db.queryOne<Route>(
      `SELECT * FROM routes WHERE route_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, schoolId],
    );
    if (!existing) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
    const fieldMap: Record<string, string> = {
      routeName: 'route_name',
      routeNameNp: 'route_name_np',
      routeDescription: 'route_description',
      routeDescriptionNp: 'route_description_np',
      startPoint: 'start_point',
      startPointNp: 'start_point_np',
      endPoint: 'end_point',
      endPointNp: 'end_point_np',
      distanceKm: 'distance_km',
      estimatedTime: 'estimated_time',
      estimatedTimeNp: 'estimated_time_np',
      provinceId: 'province_id',
      districtId: 'district_id',
      municipalityId: 'municipality_id',
      fare: 'fare',
      isActive: 'is_active',
    };
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      const v = (updateDto as any)[key];
      if (v !== undefined) {
        updates.push(`${col} = $${i++}`);
        params.push(v);
      }
    }
    if (updates.length === 0) return existing;
    params.push(id);
    return this.db.insert<Route>(
      `UPDATE routes SET ${updates.join(', ')} WHERE route_id = $${i} RETURNING *`,
      params,
    );
  }

  async deleteVehicle(id: number, schoolId: number): Promise<void> {
    const inUse = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM transport_assignments WHERE vehicle_id = $1 AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)`,
      [id],
    );
    if (inUse && parseInt(inUse.count, 10) > 0) {
      throw new BadRequestException(
        'Cannot delete vehicle with active transport assignments',
      );
    }
    const n = await this.db.update(
      `UPDATE vehicles SET deleted_at = NOW() WHERE vehicle_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, schoolId],
    );
    if (n === 0) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
  }

  async deleteRoute(id: number, schoolId: number): Promise<void> {
    const assigned = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM transport_assignments WHERE route_id = $1 AND is_active = true`,
      [id],
    );
    if (assigned && parseInt(assigned.count, 10) > 0) {
      throw new BadRequestException(
        'Cannot delete route with active student assignments',
      );
    }
    const stops = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM route_stops WHERE route_id = $1 AND is_active = true`,
      [id],
    );
    if (stops && parseInt(stops.count, 10) > 0) {
      throw new BadRequestException(
        'Cannot delete route with configured stops. Remove stops first.',
      );
    }
    const n = await this.db.update(
      `UPDATE routes SET deleted_at = NOW() WHERE route_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [id, schoolId],
    );
    if (n === 0) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
  }

  async createRouteStop(createDto: CreateRouteStopDto): Promise<RouteStop> {
    const route = await this.db.queryOne<{ route_id: number }>(
      `SELECT route_id FROM routes WHERE route_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [createDto.routeId, createDto.schoolId],
    );
    if (!route) {
      throw new NotFoundException(
        `Route with ID ${createDto.routeId} not found in this school`,
      );
    }

    const result = await this.db.insert<RouteStop>(
      `INSERT INTO route_stops (
        school_id, route_id, stop_name, stop_name_np, stop_order, latitude, longitude,
        pickup_time, drop_time, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.routeId,
        createDto.stopName,
        createDto.stopNameNp ?? null,
        createDto.stopOrder,
        createDto.latitude ?? null,
        createDto.longitude ?? null,
        createDto.arrivalTime ?? null,
        createDto.departureTime ?? null,
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
      `SELECT id FROM transport_assignments 
       WHERE student_id = $1 AND school_id = $2 AND is_active = true`,
      [assignDto.studentId, assignDto.schoolId],
    );
    if (existing) {
      throw new BadRequestException(
        'Student already has an active transport assignment',
      );
    }

    const student = await this.db.queryOne<{ student_id: number }>(
      `SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2 AND is_active = true`,
      [assignDto.studentId, assignDto.schoolId],
    );
    if (!student) {
      throw new NotFoundException('Student not found in this school');
    }
    const route = await this.db.queryOne<{ route_id: number }>(
      `SELECT route_id FROM routes WHERE route_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [assignDto.routeId, assignDto.schoolId],
    );
    if (!route) {
      throw new NotFoundException('Route not found in this school');
    }
    const stop = await this.db.queryOne<{ stop_id: number }>(
      `SELECT stop_id FROM route_stops WHERE stop_id = $1 AND route_id = $2 AND school_id = $3 AND is_active = true`,
      [assignDto.stopId, assignDto.routeId, assignDto.schoolId],
    );
    if (!stop) {
      throw new NotFoundException('Stop not found on this route');
    }
    const vehicle = await this.db.queryOne<{ vehicle_id: number }>(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [assignDto.vehicleId, assignDto.schoolId],
    );
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found in this school');
    }

    // BS date comes from the frontend — the backend stores it as given.
    const bsDate = assignDto.assignmentDateBs || null;

    const result = await this.db.insert<TransportAssignment>(
      `INSERT INTO transport_assignments (
        school_id, student_id, route_id, stop_id, vehicle_id, assignment_date, assignment_date_bs, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        assignDto.schoolId,
        assignDto.studentId,
        assignDto.routeId,
        assignDto.stopId,
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
        `UPDATE transport_fees SET monthly_fee = $1, admission_fee = $2 WHERE id = $3`,
        [monthlyFee, admissionFee || fee.admission_fee, fee.id],
      );
      const updated = await this.db.queryOne<TransportFee>(
        `SELECT * FROM transport_fees WHERE id = $1`,
        [fee.id],
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
