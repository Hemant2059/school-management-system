import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Exam } from '../../exam/entities/exam.entity';
import { Student } from '../../student/entities/student.entity';

@Entity({ name: 'marks' })
@Unique(['examId', 'studentId'])
@Index(['studentId', 'examId'])
@Index(['schoolId', 'academicYear'])
@Index(['examId', 'isSubmitted'])
export class Mark {
  @ApiProperty({ description: 'Database ID for the mark record', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'mark_id' })
  markId: number;

  @ApiProperty({
    description: 'School ID this mark record belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Exam ID', example: 1 })
  @Column({ type: 'bigint', name: 'exam_id' })
  @Index()
  examId: number;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @ApiProperty({ description: 'Student ID', example: 101 })
  @Column({ type: 'bigint', name: 'student_id' })
  @Index()
  studentId: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiPropertyOptional({
    description: 'Marks obtained in theory',
    example: 45.5,
  })
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    name: 'theory_marks',
  })
  theoryMarks: number;

  @ApiPropertyOptional({
    description: 'Marks obtained in practical',
    example: 18.0,
  })
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    name: 'practical_marks',
  })
  practicalMarks: number;

  @ApiPropertyOptional({ description: 'Total marks obtained', example: 63.5 })
  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    name: 'total_marks',
  })
  totalMarks: number;

  @ApiPropertyOptional({ description: 'Grade obtained', example: 'A' })
  @Column({ type: 'varchar', length: 5, nullable: true, name: 'grade' })
  grade: string;

  @ApiPropertyOptional({ description: 'Grade point obtained', example: 3.6 })
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'grade_point',
  })
  gradePoint: number;

  @ApiPropertyOptional({
    description: 'Grade obtained in Nepali',
    example: 'A',
  })
  @Column({ type: 'varchar', length: 5, nullable: true, name: 'grade_np' })
  gradeNp: string;

  @ApiPropertyOptional({ description: 'Rank in class', example: 5 })
  @Column({ type: 'int', nullable: true, name: 'class_rank' })
  classRank: number;

  @ApiPropertyOptional({ description: 'Rank in section', example: 3 })
  @Column({ type: 'int', nullable: true, name: 'section_rank' })
  sectionRank: number;

  @ApiPropertyOptional({ description: 'Remarks on the result' })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'remarks' })
  remarks: string;

  @ApiProperty({
    description: 'Whether the marks are submitted',
    default: false,
  })
  @Column({ type: 'boolean', default: false, name: 'is_submitted' })
  @Index()
  isSubmitted: boolean;

  @ApiProperty({
    description: 'Whether the marks are verified',
    default: false,
  })
  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  @Index()
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Academic year' })
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
}
