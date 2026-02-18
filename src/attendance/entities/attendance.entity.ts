import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'attendance_records' })
@Index(['schoolId', 'attendanceDate', 'classId', 'sectionId']) // Daily class report
@Index(['schoolId', 'studentId', 'attendanceDate']) // Single student history
@Index(['schoolId', 'academicYear']) // Yearly stats
export class Attendance {
  @ApiProperty({
    description: 'Database ID for the attendance record',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'attendance_id' })
  attendanceId: number;

  @ApiProperty({
    description: 'School ID this attendance record belongs to',
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

  @ApiProperty({ description: 'Academic Class ID', example: 5 })
  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @ApiPropertyOptional({ description: 'Section ID', example: 1 })
  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  @Index()
  sectionId: number;

  @ApiProperty({ description: 'Date of attendance', example: '2024-04-14' })
  @Column({ type: 'date', name: 'attendance_date' })
  attendanceDate: Date;

  @ApiPropertyOptional({
    description: 'Date of attendance in BS',
    example: '2081-01-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'attendance_date_bs',
  })
  attendanceDateBs: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'],
    example: 'PRESENT',
  })
  @Column({
    type: 'enum',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'],
    name: 'status',
  })
  status: string;

  @ApiProperty({ description: 'Academic year', example: '2024/2025' })
  @Column({ type: 'varchar', length: 50, name: 'academic_year' })
  academicYear: string;

  @ApiProperty({
    description: 'Attendance session',
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY'],
    default: 'FULL_DAY',
  })
  @Column({
    type: 'enum',
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY'],
    default: 'FULL_DAY',
    name: 'session',
  })
  session: string;

  @ApiPropertyOptional({ description: 'Additional remarks' })
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'remarks' })
  remarks: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;

  getNepaliDate(): string {
    return this.attendanceDateBs || '';
  }
}
