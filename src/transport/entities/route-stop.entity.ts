import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'route_stops' })
export class RouteStop {
  @ApiProperty({ description: 'Database ID for the route stop', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'stop_id' })
  stopId: number;

  @ApiProperty({
    description: 'School ID this route stop belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Route ID', example: 1 })
  @Column({ type: 'bigint', name: 'route_id' })
  @Index()
  routeId: number;

  @ApiProperty({ description: 'Name of the stop', example: 'Baluwatar Chowk' })
  @Column({ type: 'varchar', length: 200, name: 'stop_name' })
  stopName: string;

  @ApiPropertyOptional({
    description: 'Name of the stop (Nepali)',
    example: 'बालुवाटार चोक',
  })
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'stop_name_np',
  })
  stopNameNp: string;

  @ApiProperty({ description: 'Sequence number of the stop', example: 1 })
  @Column({ type: 'int', name: 'stop_order' })
  stopOrder: number;

  @ApiPropertyOptional({ description: 'Latitude coordinate', example: 27.7123 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    name: 'latitude',
  })
  latitude: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 85.3245,
  })
  @Column({
    type: 'decimal',
    precision: 11,
    scale: 7,
    nullable: true,
    name: 'longitude',
  })
  longitude: number;

  @ApiPropertyOptional({
    description: 'Estimated arrival time',
    example: '10:15:00',
  })
  @Column({ type: 'time', nullable: true, name: 'arrival_time' })
  arrivalTime: string;

  @ApiPropertyOptional({
    description: 'Estimated departure time',
    example: '10:20:00',
  })
  @Column({ type: 'time', nullable: true, name: 'departure_time' })
  departureTime: string;

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
