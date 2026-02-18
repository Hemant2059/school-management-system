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
import { User } from './user.entity';
import { School } from '../../school/entities/school.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'user_sessions' })
export class UserSession {
  @ApiProperty({
    description: 'Unique session identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  sessionId: string;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Column({ type: 'bigint', name: 'user_id' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'School ID this session belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Exclude()
  @Column({ type: 'varchar', length: 255, name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @ApiPropertyOptional({
    description: 'Device name',
    example: 'Chrome on Windows',
  })
  @Column({ type: 'varchar', length: 255, name: 'device_name', nullable: true })
  deviceName: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
  })
  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent: string;

  @ApiProperty({ description: 'Last active timestamp' })
  @Column({ type: 'timestamp', name: 'last_active_at' })
  lastActiveAt: Date;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
