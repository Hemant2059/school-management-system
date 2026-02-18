import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @ApiProperty({
    description: 'Database ID for the audit log entry',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'audit_id' })
  auditId: number;

  @ApiPropertyOptional({
    description: 'User ID who performed the action',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'user_id', nullable: true })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiPropertyOptional({
    description: 'School ID this log belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id', nullable: true })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Action performed', example: 'CREATE' })
  @Column({ type: 'varchar', length: 50, name: 'action' })
  @Index()
  action: string; // e.g., CREATE, UPDATE, DELETE, LOGIN, LOGOUT

  @ApiProperty({ description: 'Module affected', example: 'STUDENT' })
  @Column({ type: 'varchar', length: 50, name: 'module' })
  @Index()
  module: string; // e.g., STUDENT, FEE, AUTH

  @ApiPropertyOptional({ description: 'Resource ID affected', example: '101' })
  @Column({ type: 'text', name: 'resource_id', nullable: true })
  resourceId: string;

  @ApiPropertyOptional({
    description: 'Detailed changes or metadata (JSON)',
    example: { field: 'status', oldValue: 'ACTIVE', newValue: 'INACTIVE' },
  })
  @Column({ type: 'jsonb', name: 'details', nullable: true })
  details: any;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
  })
  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  @Index()
  createdAt: Date;
}
