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

@Entity({ name: 'routes' })
export class Route {
  @ApiProperty({ description: 'Database ID for the route', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'route_id' })
  routeId: number;

  @ApiProperty({ description: 'School ID this route belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({
    description: 'Name of the route',
    example: 'Kathmandu-Baluwatar to Sano Thimi',
  })
  @Column({ type: 'varchar', length: 200, name: 'route_name' })
  routeName: string;

  @ApiProperty({ description: 'Unique route code', example: 'R001' })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'route_code' })
  routeCode: string;

  // Nepal Geographic Hierarchy
  @ApiPropertyOptional({ description: 'Province ID', example: 3 })
  @Column({ type: 'int', nullable: true, name: 'province_id' })
  provinceId: number;

  @ApiPropertyOptional({ description: 'District ID', example: 27 })
  @Column({ type: 'int', nullable: true, name: 'district_id' })
  districtId: number;

  @ApiPropertyOptional({ description: 'Municipality ID', example: 5 })
  @Column({ type: 'int', nullable: true, name: 'municipality_id' })
  municipalityId: number;

  @ApiProperty({
    description: 'Detailed route description',
    example:
      'Starts from Baluwatar, passes through Maitidevi, ends at Sano Thimi',
  })
  @Column({ type: 'varchar', length: 255, name: 'route_description' })
  routeDescription: string;

  @ApiProperty({ description: 'Total route distance in km', example: 12.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'distance_km' })
  distanceKm: number;

  @ApiPropertyOptional({
    description: 'Estimated travel time',
    example: '00:45:00',
  })
  @Column({ type: 'time', nullable: true, name: 'estimated_time' })
  estimatedTime: string;

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
