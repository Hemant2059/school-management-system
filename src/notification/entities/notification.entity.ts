import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity({ name: 'notifications' })
export class Notification {
  @ApiProperty({ description: 'Database ID for the notification', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_id' })
  notificationId: number;

  @ApiProperty({ description: 'Notification title', example: 'Exam Alert' })
  @Column({ type: 'varchar', length: 255, name: 'title' })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Your exam is tomorrow.',
  })
  @Column({ type: 'varchar', length: 1000, name: 'message' })
  message: string;

  @ApiPropertyOptional({
    description: 'Notification message in Nepali',
    example: 'तपाईंको परीक्षा भोलि छ।',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'message_np' })
  messageNp: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['INFO', 'WARNING', 'URGENT', 'EXAM', 'FEE', 'ATTENDANCE', 'RESULT'],
    example: 'EXAM',
  })
  @Column({
    type: 'enum',
    enum: ['INFO', 'WARNING', 'URGENT', 'EXAM', 'FEE', 'ATTENDANCE', 'RESULT'],
    name: 'type',
  })
  type: string;

  @ApiPropertyOptional({ description: 'Target School ID', example: 1 })
  @Column({ type: 'bigint', nullable: true, name: 'school_id' })
  @Index()
  schoolId: number;

  @ApiPropertyOptional({ description: 'Target Class ID', example: 5 })
  @Column({ type: 'bigint', nullable: true, name: 'class_id' })
  classId: number;

  @ApiPropertyOptional({ description: 'Target Section ID', example: 2 })
  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  sectionId: number;

  @ApiPropertyOptional({ description: 'Target Student ID', example: 101 })
  @Column({ type: 'bigint', nullable: true, name: 'student_id' })
  @Index()
  studentId: number;

  @ApiPropertyOptional({ description: 'Target Guardian ID', example: 45 })
  @Column({ type: 'bigint', nullable: true, name: 'guardian_id' })
  guardianId: number;

  @ApiProperty({ description: 'Is read?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @ApiProperty({ description: 'Is SMS sent?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_sms_sent' })
  isSmsSent: boolean;

  @ApiProperty({ description: 'Retry count', default: 0 })
  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @ApiProperty({ description: 'Requires manual follow-up?', default: false })
  @Column({
    type: 'boolean',
    default: false,
    name: 'requires_manual_followup',
  })
  requiresManualFollowup: boolean; // Flag for failed SMS/WhatsApp after retries

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
