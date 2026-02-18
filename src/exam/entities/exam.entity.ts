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
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Section } from '../../section/entities/section.entity';
import { Subject } from '../../subject/entities/subject.entity';

@Entity({ name: 'exams' })
@Index(['schoolId', 'academicYear', 'isActive'])
@Index(['schoolId', 'examType', 'academicYear'])
@Index(['classId', 'examDate'])
export class Exam {
  @ApiProperty({ description: 'Database ID for the exam', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'exam_id' })
  examId: number;

  @ApiProperty({ description: 'School ID this exam belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({
    description: 'Name of the exam',
    example: 'First Terminal Examination 2024',
  })
  @Column({ type: 'varchar', length: 200, name: 'exam_name' })
  examName: string;

  @ApiProperty({ description: 'Unique exam code', example: 'EXAM-2024-T1' })
  @Column({ type: 'varchar', length: 50, name: 'exam_code' })
  @Index()
  examCode: string;

  @ApiProperty({
    description: 'Type of examination',
    enum: ['UNIT_TEST', 'TERMINAL', 'FINAL', 'SEE', 'NEB', 'BOARD', 'OTHER'],
    example: 'TERMINAL',
  })
  @Column({
    type: 'enum',
    enum: ['UNIT_TEST', 'TERMINAL', 'FINAL', 'SEE', 'NEB', 'BOARD', 'OTHER'],
    name: 'exam_type',
  })
  @Index()
  examType: string;

  @ApiProperty({ description: 'Academic class ID', example: 5 })
  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @ManyToOne(() => AcademicClass)
  @JoinColumn({ name: 'class_id' })
  class: AcademicClass;

  @ApiPropertyOptional({ description: 'Section ID', example: 1 })
  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  @Index()
  sectionId: number;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ApiProperty({ description: 'Subject ID', example: 10 })
  @Column({ type: 'bigint', name: 'subject_id' })
  @Index()
  subjectId: number;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ApiProperty({ description: 'Date of the exam', example: '2024-03-15' })
  @Column({ type: 'date', name: 'exam_date' })
  @Index()
  examDate: Date;

  @ApiPropertyOptional({
    description: 'Date of the exam in BS',
    example: '2080-12-02',
  })
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'exam_date_bs' })
  examDateBs: string;

  @ApiPropertyOptional({
    description: 'Start time of the exam',
    example: '10:00:00',
  })
  @Column({ type: 'time', nullable: true, name: 'start_time' })
  startTime: string;

  @ApiPropertyOptional({
    description: 'End time of the exam',
    example: '13:00:00',
  })
  @Column({ type: 'time', nullable: true, name: 'end_time' })
  endTime: string;

  @ApiProperty({ description: 'Full marks for the exam', example: 100 })
  @Column({ type: 'int', name: 'full_marks' })
  fullMarks: number;

  @ApiProperty({ description: 'Pass marks for the exam', example: 40 })
  @Column({ type: 'int', name: 'pass_marks' })
  passMarks: number;

  @ApiProperty({ description: 'Whether the exam is published', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_published' })
  @Index()
  isPublished: boolean;

  @ApiProperty({ description: 'Whether the exam is active', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the exam result is published to students',
    default: false,
  })
  @Column({ type: 'boolean', default: false, name: 'is_result_published' })
  isResultPublished: boolean;

  @ApiProperty({
    description: 'Whether the exam marks are locked for editing',
    default: false,
  })
  @Column({ type: 'boolean', default: false, name: 'is_locked' })
  @Index()
  isLocked: boolean;

  @ApiPropertyOptional({ description: 'Exam remarks/instructions' })
  @Column({ type: 'text', nullable: true, name: 'remarks' })
  remarks: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'academic_year',
  })
  @Index()
  academicYear: string;

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
