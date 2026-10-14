import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

export interface School {
  school_id: number;
  school_code: string;
  school_name: string;
  school_name_nepali: string | null;
  school_type: string;
  ownership_type: string;
  established_date: Date | null;
  established_date_bs: string | null;
  affiliation_number: string | null;
  registration_number: string | null;
  province_id: number | null;
  district_id: number | null;
  municipality_id: number | null;
  ward_no: number | null;
  tole: string | null;
  tole_nepali: string | null;
  street_address: string | null;
  street_address_nepali: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class SchoolService {
  constructor(private db: DatabaseService) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    userId: number = 1,
  ): Promise<School> {
    const existing = await this.db.queryOne<School>(
      `SELECT * FROM schools WHERE (school_name = $1 OR school_code = $2) AND is_active = true`,
      [createSchoolDto.schoolName, createSchoolDto.schoolCode],
    );

    if (existing) {
      if (existing.school_code === createSchoolDto.schoolCode) {
        throw new BadRequestException('School with this code already exists');
      }
      throw new BadRequestException('School with this name already exists');
    }

    const school = await this.db.insert<School>(
      `INSERT INTO schools (school_code, school_name, school_name_nepali, school_type, ownership_type, established_date, established_date_bs, affiliation_number, registration_number, province_id, district_id, municipality_id, ward_no, tole, tole_nepali, street_address, street_address_nepali, mobile, email, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true, $20, $21)
       RETURNING *`,
      [
        createSchoolDto.schoolCode,
        createSchoolDto.schoolName,
        createSchoolDto.schoolNameNepali || null,
        createSchoolDto.schoolType,
        createSchoolDto.ownershipType,
        createSchoolDto.establishedDate || null,
        createSchoolDto.establishedDateBs || null,
        createSchoolDto.affiliationNumber || null,
        createSchoolDto.registrationNumber || null,
        createSchoolDto.provinceId || null,
        createSchoolDto.districtId || null,
        createSchoolDto.municipalityId || null,
        createSchoolDto.wardNo || null,
        createSchoolDto.tole || null,
        createSchoolDto.toleNepali || null,
        createSchoolDto.streetAddress || null,
        createSchoolDto.streetAddressNepali || null,
        createSchoolDto.mobile || null,
        createSchoolDto.email || null,
        userId,
        userId,
      ],
    );

    return school;
  }

  async findAll(): Promise<School[]> {
    return this.db.query<School>(
      `SELECT * FROM schools WHERE is_active = true ORDER BY created_at DESC`,
    );
  }

  async findOne(id: number): Promise<School> {
    const school = await this.db.queryOne<School>(
      `SELECT * FROM schools WHERE school_id = $1 AND is_active = true`,
      [id],
    );

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
  }

  async update(
    id: number,
    updateSchoolDto: UpdateSchoolDto,
    userId: number = 1,
  ): Promise<School> {
    const school = await this.findOne(id);

    if (updateSchoolDto.affiliationNumber && school.affiliation_number) {
      throw new BadRequestException(
        'Affiliation number cannot be changed after creation',
      );
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields: Record<string, string> = {
      schoolName: 'school_name',
      schoolNameNepali: 'school_name_nepali',
      schoolType: 'school_type',
      ownershipType: 'ownership_type',
      affiliationNumber: 'affiliation_number',
      registrationNumber: 'registration_number',
      provinceId: 'province_id',
      districtId: 'district_id',
      municipalityId: 'municipality_id',
      wardNo: 'ward_no',
      tole: 'tole',
      toleNepali: 'tole_nepali',
      streetAddress: 'street_address',
      streetAddressNepali: 'street_address_nepali',
      mobile: 'mobile',
      email: 'email',
    };

    for (const [key, dbField] of Object.entries(fields)) {
      if (updateSchoolDto[key as keyof UpdateSchoolDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateSchoolDto[key as keyof UpdateSchoolDto]);
      }
    }

    if (updates.length > 0) {
      updates.push(`updated_by = $${paramIndex++}`);
      params.push(userId);
      params.push(id);

      await this.db.query(
        `UPDATE schools SET ${updates.join(', ')}, updated_at = NOW() WHERE school_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id);
  }

  async remove(id: number, userId: number = 1): Promise<void> {
    await this.findOne(id);
    await this.db.query(
      `UPDATE schools SET is_active = false, deleted_at = NOW(), updated_by = $2 WHERE school_id = $1`,
      [id, userId],
    );
  }

  async getSchoolWithNepaliDate(id: number): Promise<any> {
    const school = await this.findOne(id);
    return school;
  }
}
