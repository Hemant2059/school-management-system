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
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Student } from '../../student/entities/student.entity';
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Section } from '../../section/entities/section.entity';

@Entity({ name: 'student_enrollments' })
@Unique(['studentId', 'academicYear', 'classId', 'sectionId'])
@Index(['schoolId', 'academicYear', 'isCurrent'])
@Index(['studentId', 'academicYear'])
@Index(['classId', 'sectionId', 'academicYear'])
export class Enrollment {
  @ApiProperty({ description: 'Database ID for the enrollment', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'enrollment_id' })
  enrollmentId: number;

  @ApiProperty({
    description: 'School ID this enrollment belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Student ID', example: 1001 })
  @Column({ type: 'bigint', name: 'student_id' })
  @Index()
  studentId: number;

  @ManyToOne(() => Student, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiProperty({ description: 'Class ID', example: 5 })
  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @ManyToOne(() => AcademicClass, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'class_id' })
  academicClass: AcademicClass;

  @ApiPropertyOptional({ description: 'Section ID', example: 2 })
  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  @Index()
  sectionId: number;

  @ManyToOne(() => Section, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ApiProperty({ description: 'Academic year', example: '2081-2082' })
  @Column({ type: 'varchar', length: 50, name: 'academic_year' })
  @Index()
  academicYear: string;

  @ApiProperty({ description: 'Enrollment date', example: '2024-04-15' })
  @Column({ type: 'date', name: 'enrollment_date' })
  enrollmentDate: Date;

  @ApiPropertyOptional({
    description: 'Enrollment date in BS',
    example: '2081-01-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'enrollment_date_bs',
  })
  enrollmentDateBs: string;

  @ApiProperty({
    description: 'Enrollment status',
    enum: [
      'ACTIVE',
      'PROMOTED',
      'REPEATED',
      'TRANSFERRED_OUT',
      'TRANSFERRED_IN',
      'DROPPED',
      'GRADUATED',
    ],
    default: 'ACTIVE',
    example: 'ACTIVE',
  })
  @Column({
    type: 'enum',
    enum: [
      'ACTIVE',
      'PROMOTED',
      'REPEATED',
      'TRANSFERRED_OUT',
      'TRANSFERRED_IN',
      'DROPPED',
      'GRADUATED',
    ],
    default: 'ACTIVE',
    name: 'status',
  })
  @Index()
  status: string;

  @ApiProperty({ description: 'Is current enrollment?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_current' })
  @Index()
  isCurrent: boolean;

  @ApiPropertyOptional({ description: 'Roll number', example: 'ROLL-001' })
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'roll_number' })
  rollNumber: string;

  @ApiPropertyOptional({
    description: 'Board exam registration number (SEE/NEB)',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'board_exam_registration',
  })
  boardExamRegistration: string;

  @ApiPropertyOptional({
    description: 'Previous academic year (for promoted students)',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'previous_academic_year',
  })
  previousAcademicYear: string;

  @ApiPropertyOptional({
    description: 'Previous class ID (for promoted/repeated students)',
  })
  @Column({
    type: 'bigint',
    nullable: true,
    name: 'previous_class_id',
  })
  previousClassId: number;

  @ApiPropertyOptional({ description: 'Enrollment remarks' })
  @Column({
    type: 'text',
    nullable: true,
    name: 'remarks',
  })
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

  @ApiPropertyOptional({
    description: 'ID of the user who created this record',
  })
  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @ApiPropertyOptional({
    description: 'ID of the user who updated this record',
  })
  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;
}
