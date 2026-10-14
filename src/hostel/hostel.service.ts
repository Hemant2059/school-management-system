import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Hostel {
  id?: number;
  schoolId: number;
  name: string;
  type: 'boys' | 'girls' | 'mixed';
  totalBeds: number;
  availableBeds: number;
  address?: string;
  wardNumber?: number;
  isActive: boolean;
  createdAt?: Date;
}

export interface Room {
  id?: number;
  hostelId: number;
  roomNumber: string;
  floor: number;
  totalBeds: number;
  availableBeds: number;
  roomType: 'single' | 'double' | 'triple' | 'dormitory';
  monthlyRent: number;
  isActive: boolean;
}

export interface HostelStudent {
  id?: number;
  hostelId: number;
  roomId: number;
  studentId: number;
  bedNumber: string;
  checkInDate: Date;
  checkInDateBs: string;
  checkOutDate?: Date;
  checkOutDateBs?: string;
  status: 'active' | 'checked_out';
}

export interface CreateHostelDto {
  name: string;
  nameNp?: string;
  type: 'boys' | 'girls' | 'mixed';
  totalBeds: number;
  address?: string;
  addressNp?: string;
  wardenNameNp?: string;
  wardNumber?: number;
}

export interface CreateRoomDto {
  hostelId: number;
  roomNumber: string;
  floor: number;
  totalBeds: number;
  roomType: 'single' | 'double' | 'triple' | 'dormitory';
  roomTypeNp?: string;
  monthlyRent: number;
}

export interface AssignStudentDto {
  hostelId: number;
  roomId: number;
  studentId: number;
  bedNumber: string;
  checkInDate: string;
  checkInDateBs?: string;
}

@Injectable()
export class HostelService {
  constructor(private databaseService: DatabaseService) {}

  async createHostel(schoolId: number, dto: CreateHostelDto): Promise<Hostel> {
    const query = `
      INSERT INTO hostels (school_id, name, name_np, type, total_beds, available_beds, address, address_np, warden_name, warden_name_np, ward_number)
      VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      dto.name,
      dto.nameNp ?? null,
      dto.type,
      dto.totalBeds,
      dto.address,
      dto.addressNp ?? null,
      (dto as any).wardenName ?? null,
      dto.wardenNameNp ?? null,
      dto.wardNumber,
    ]);

    return result[0];
  }

  async getHostels(schoolId: number): Promise<Hostel[]> {
    const query =
      'SELECT * FROM hostels WHERE school_id = $1 AND is_active = true ORDER BY name';
    return this.databaseService.query(query, [schoolId]);
  }

  async getHostelById(id: number, schoolId: number): Promise<Hostel> {
    const query =
      'SELECT * FROM hostels WHERE hostel_id = $1 AND school_id = $2';
    const result = await this.databaseService.query(query, [id, schoolId]);

    if (!result[0]) {
      throw new NotFoundException('Hostel not found');
    }

    return result[0];
  }

  async updateHostel(
    id: number,
    schoolId: number,
    dto: Partial<CreateHostelDto>,
  ): Promise<Hostel> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(dto.name);
    }
    if (dto.nameNp !== undefined) {
      fields.push(`name_np = $${paramCount++}`);
      values.push(dto.nameNp ?? null);
    }
    if (dto.type) {
      fields.push(`type = $${paramCount++}`);
      values.push(dto.type);
    }
    if (dto.totalBeds) {
      fields.push(`total_beds = $${paramCount++}`);
      values.push(dto.totalBeds);
    }
    if (dto.address) {
      fields.push(`address = $${paramCount++}`);
      values.push(dto.address);
    }
    if (dto.addressNp !== undefined) {
      fields.push(`address_np = $${paramCount++}`);
      values.push(dto.addressNp ?? null);
    }
    if (dto.wardenNameNp !== undefined) {
      fields.push(`warden_name_np = $${paramCount++}`);
      values.push(dto.wardenNameNp ?? null);
    }
    if ((dto as any).wardenName !== undefined) {
      fields.push(`warden_name = $${paramCount++}`);
      values.push((dto as any).wardenName ?? null);
    }
    if (dto.wardNumber) {
      fields.push(`ward_number = $${paramCount++}`);
      values.push(dto.wardNumber);
    }

    values.push(id, schoolId);
    const query = `
      UPDATE hostels SET ${fields.join(', ')}
      WHERE hostel_id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.databaseService.query(query, values);

    if (!result[0]) {
      throw new NotFoundException('Hostel not found');
    }

    return result[0];
  }

  async deleteHostel(id: number, schoolId: number): Promise<void> {
    const query =
      'UPDATE hostels SET is_active = false WHERE hostel_id = $1 AND school_id = $2 RETURNING hostel_id';
    const result = await this.databaseService.query(query, [id, schoolId]);

    if (result.length === 0) {
      throw new NotFoundException('Hostel not found');
    }
  }

  async createRoom(dto: CreateRoomDto): Promise<Room> {
    const query = `
      INSERT INTO hostel_rooms (hostel_id, room_number, floor, capacity, available_beds, room_type, room_type_np, price)
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      dto.hostelId,
      dto.roomNumber,
      dto.floor,
      dto.totalBeds,
      dto.roomType,
      dto.roomTypeNp ?? null,
      dto.monthlyRent,
    ]);

    return result[0];
  }

  async getRooms(hostelId?: number, schoolId?: number): Promise<Room[]> {
    let query = `SELECT hr.* FROM hostel_rooms hr
      JOIN hostels h ON h.hostel_id = hr.hostel_id
      WHERE hr.is_active = true`;
    const params: any[] = [];

    if (hostelId) {
      params.push(hostelId);
      query += ` AND hr.hostel_id = $${params.length}`;
    }
    if (schoolId) {
      params.push(schoolId);
      query += ` AND h.school_id = $${params.length}`;
    }

    query += ' ORDER BY hr.floor, hr.room_number';
    return this.databaseService.query(query, params);
  }

  async assignStudent(
    schoolId: number,
    dto: AssignStudentDto,
  ): Promise<HostelStudent> {
    const roomQuery =
      'SELECT * FROM hostel_rooms WHERE room_id = $1 AND is_active = true';
    const room = await this.databaseService.query(roomQuery, [dto.roomId]);

    if (!room[0]) {
      throw new NotFoundException('Room not found');
    }

    if (room[0].available_beds <= 0) {
      throw new BadRequestException('No beds available in this room');
    }

    const query = `
      INSERT INTO hostel_students (school_id, hostel_id, room_id, student_id, bed_number, check_in_date, check_in_date_bs, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      dto.hostelId,
      dto.roomId,
      dto.studentId,
      dto.bedNumber,
      new Date(dto.checkInDate),
      // BS date comes from the frontend — the backend stores it as given.
      dto.checkInDateBs || null,
    ]);

    await this.updateRoomAvailability(dto.roomId, -1);

    return result[0];
  }

  async checkOutStudent(
    id: number,
    schoolId: number,
    checkOutDate: string,
    checkOutDateBs?: string,
  ): Promise<HostelStudent> {
    // BS date comes from the frontend — the backend stores it as given.
    const checkOutBs = checkOutDateBs || null;
    const query = `
      UPDATE hostel_students
      SET check_out_date = $3::date, check_out_date_bs = $4, status = 'checked_out'
      WHERE id = $1 AND hostel_id IN (SELECT hostel_id FROM hostels WHERE school_id = $2)
      RETURNING *
    `;

    const result = await this.databaseService.query(query, [
      id,
      schoolId,
      checkOutDate,
      checkOutBs,
    ]);

    if (!result[0]) {
      throw new NotFoundException('Hostel student not found');
    }

    await this.updateRoomAvailability(result[0].room_id, 1);

    return result[0];
  }

  async getHostelStudents(schoolId: number, hostelId?: number): Promise<any[]> {
    let query = `
      SELECT hs.*, s.first_name_en, s.last_name_en, s.admission_number, 
             hr.room_number, hr.floor, h.name as hostel_name
      FROM hostel_students hs
      JOIN students s ON hs.student_id = s.student_id
      JOIN hostel_rooms hr ON hs.room_id = hr.room_id
      JOIN hostels h ON hs.hostel_id = h.hostel_id
      WHERE h.school_id = $1
    `;
    const params: any[] = [schoolId];

    if (hostelId) {
      params.push(hostelId);
      query += ` AND hs.hostel_id = $${params.length}`;
    }

    query += ' ORDER BY hs.check_in_date DESC';
    return this.databaseService.query(query, params);
  }

  async getHostelStatistics(schoolId: number): Promise<any> {
    const query = `
      SELECT 
        h.hostel_id, h.name, h.type, h.total_beds, h.available_beds,
        COUNT(DISTINCT hs.id) as "occupiedBeds",
        COUNT(DISTINCT hr.room_id) as "totalRooms"
      FROM hostels h
      LEFT JOIN hostel_rooms hr ON h.hostel_id = hr.hostel_id AND hr.is_active = true
      LEFT JOIN hostel_students hs ON h.hostel_id = hs.hostel_id AND hs.status = 'active'
      WHERE h.school_id = $1 AND h.is_active = true
      GROUP BY h.hostel_id
    `;

    return this.databaseService.query(query, [schoolId]);
  }

  private async updateRoomAvailability(
    roomId: number,
    change: number,
  ): Promise<void> {
    const query = `
      UPDATE hostel_rooms 
      SET available_beds = available_beds + $2
      WHERE room_id = $1
    `;
    await this.databaseService.query(query, [roomId, change]);
  }
}
