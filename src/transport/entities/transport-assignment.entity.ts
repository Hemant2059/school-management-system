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

@Entity({ name: 'transport_assignments' })
export class TransportAssignment {
  @ApiProperty({ description: 'Database ID for the assignment', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'assignment_id' })
  assignmentId: number;

  @ApiProperty({
    description: 'School ID this assignment belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Student ID', example: 101 })
  @Column({ type: 'bigint', name: 'student_id' })
  @Index()
  studentId: number;

  @ApiProperty({ description: 'Route ID', example: 1 })
  @Column({ type: 'bigint', name: 'route_id' })
  routeId: number;

  @ApiProperty({ description: 'Stop ID', example: 5 })
  @Column({ type: 'bigint', name: 'stop_id' })
  stopId: number;

  @ApiProperty({ description: 'Vehicle ID', example: 2 })
  @Column({ type: 'bigint', name: 'vehicle_id' })
  vehicleId: number;

  @ApiProperty({ description: 'Date of assignment', example: '2024-05-20' })
  @Column({ type: 'date', name: 'assignment_date' })
  assignmentDate: Date;

  @ApiPropertyOptional({
    description: 'Date of assignment in BS',
    example: '2081-02-06',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'assignment_date_bs',
  })
  assignmentDateBs: string;

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Morning shift only',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'remarks' })
  remarks: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
