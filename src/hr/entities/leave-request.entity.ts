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

@Entity({ name: 'leave_requests' })
export class LeaveRequest {
  @ApiProperty({ description: 'Database ID for the leave request', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'leave_request_id' })
  leaveRequestId: number;

  @ApiProperty({
    description: 'School ID this leave request belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Staff ID', example: 1 })
  @Column({ type: 'bigint', name: 'staff_id' })
  @Index()
  staffId: number;

  @ApiProperty({ description: 'Leave Type ID', example: 1 })
  @Column({ type: 'bigint', name: 'leave_type_id' })
  leaveTypeId: number;

  @ApiProperty({ description: 'Leave start date', example: '2024-05-10' })
  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'Leave start date in BS',
    example: '2081-01-27',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'start_date_bs',
  })
  startDateBs: string;

  @ApiProperty({ description: 'Leave end date', example: '2024-05-12' })
  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Leave end date in BS',
    example: '2081-01-29',
  })
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'end_date_bs' })
  endDateBs: string;

  @ApiProperty({ description: 'Number of days requested', example: 3 })
  @Column({ type: 'int', name: 'days_requested' })
  daysRequested: number;

  @ApiProperty({
    description: 'Reason for leave',
    example: 'Medical emergency',
  })
  @Column({ type: 'varchar', length: 500, name: 'reason' })
  reason: string;

  @ApiProperty({
    description: 'Status of the request',
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
  })
  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
    name: 'status',
  })
  status: string;

  @ApiPropertyOptional({ description: 'ID of the approver' })
  @Column({ type: 'bigint', nullable: true, name: 'approved_by' })
  approvedBy: number;

  @ApiPropertyOptional({ description: 'Reason for rejection if rejected' })
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'rejection_reason',
  })
  rejectionReason: string;

  @ApiProperty({ description: 'Whether the request is active', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
