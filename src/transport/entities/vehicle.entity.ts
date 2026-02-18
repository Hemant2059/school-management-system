import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'vehicles' })
export class Vehicle {
  @ApiProperty({ description: 'Database ID for the vehicle', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'vehicle_id' })
  vehicleId: number;

  @ApiProperty({ description: 'School ID this vehicle belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({
    description: 'Vehicle number plate',
    example: 'Ba 1 Kha 2345',
  })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'vehicle_number' })
  vehicleNumber: string;

  @ApiProperty({
    description: 'Vehicle name/identifier',
    example: 'School Bus 1',
  })
  @Column({ type: 'varchar', length: 100, name: 'vehicle_name' })
  vehicleName: string;

  @ApiProperty({ description: 'Type of vehicle', example: 'Bus' })
  @Column({ type: 'varchar', length: 50, name: 'vehicle_type' })
  vehicleType: string;

  @ApiProperty({ description: 'Seating capacity', example: 40 })
  @Column({ type: 'int', name: 'capacity' })
  capacity: number;

  @ApiPropertyOptional({ description: 'Manufacturer name', example: 'Tata' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'manufacturer',
  })
  manufacturer: string;

  @ApiPropertyOptional({ description: 'Manufacturing year', example: 2020 })
  @Column({ type: 'int', nullable: true, name: 'year' })
  year: number;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'Yellow' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'color' })
  color: string;

  @ApiPropertyOptional({ description: 'Chassis number' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'chassis_number',
  })
  chassisNumber: string;

  @ApiPropertyOptional({ description: 'Engine number' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'engine_number',
  })
  engineNumber: string;

  @ApiPropertyOptional({
    description: 'Insurance expiry date',
    example: '2025-01-01',
  })
  @Column({ type: 'date', nullable: true, name: 'insurance_expiry' })
  insuranceExpiry: Date;

  @ApiPropertyOptional({
    description: 'Permit expiry date',
    example: '2025-01-01',
  })
  @Column({ type: 'date', nullable: true, name: 'permit_expiry' })
  permitExpiry: Date;

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
