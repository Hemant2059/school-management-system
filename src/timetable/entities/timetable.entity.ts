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
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Section } from '../../section/entities/section.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';

@Entity({ name: 'timetables' })
export class Timetable {
  @ApiProperty({
    description: 'Database ID for the timetable entry',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'timetable_id' })
  timetableId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ApiProperty({ description: 'Class ID', example: 5 })
  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @ManyToOne(() => AcademicClass, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: AcademicClass;

  @ApiPropertyOptional({ description: 'Section ID', example: 2 })
  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  sectionId: number;

  @ManyToOne(() => Section, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ApiProperty({ description: 'Subject ID', example: 10 })
  @Column({ type: 'bigint', name: 'subject_id' })
  @Index()
  subjectId: number;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ApiProperty({ description: 'Teacher ID', example: 3 })
  @Column({ type: 'bigint', name: 'teacher_id' })
  teacherId: number;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ApiProperty({ description: 'Day of week (0-6)', example: 1 })
  @Column({ type: 'int', name: 'day_of_week' })
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time', example: '09:00:00' })
  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @ApiProperty({ description: 'End time', example: '09:45:00' })
  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @ApiProperty({ description: 'Period number', example: 1 })
  @Column({ type: 'int', name: 'period_number' })
  periodNumber: number;

  @ApiPropertyOptional({ description: 'Room number', example: '201' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'room_number' })
  roomNumber: string;

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
