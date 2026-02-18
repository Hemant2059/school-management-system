import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'leave_types' })
export class LeaveType {
  @ApiProperty({ description: 'Database ID for the leave type', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'leave_type_id' })
  leaveTypeId: number;

  @ApiProperty({
    description: 'School ID this leave type belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({
    description: 'Name of the leave type (English)',
    example: 'Sick Leave',
  })
  @Column({ type: 'varchar', length: 100, name: 'leave_type_name' })
  leaveTypeName: string;

  @ApiPropertyOptional({
    description: 'Name of the leave type (Nepali)',
    example: 'बिरामी बिदा',
  })
  @Column({ type: 'varchar', length: 100, name: 'leave_type_name_np' })
  leaveTypeNameNp: string;

  @ApiProperty({
    description: 'Number of days allocated per year',
    example: 12,
  })
  @Column({ type: 'int', name: 'days_allocated' })
  daysAllocated: number;

  @ApiProperty({
    description: 'Whether this leave type is paid',
    default: true,
  })
  @Column({ type: 'boolean', default: true, name: 'is_paid' })
  isPaid: boolean;

  @ApiProperty({
    description: 'Whether this leave type is active',
    default: true,
  })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
