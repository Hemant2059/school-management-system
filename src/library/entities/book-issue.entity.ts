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
import { Student } from '../../student/entities/student.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Book } from './book.entity';

@Entity({ name: 'book_issues' })
export class BookIssue {
  @ApiProperty({ description: 'Database ID for the issue record', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'issue_id' })
  issueId: number;

  @ApiProperty({
    description: 'School ID this book issue record belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Book ID', example: 10 })
  @Column({ type: 'bigint', name: 'book_id' })
  @Index()
  bookId: number;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ApiProperty({ description: 'Student ID', example: 101 })
  @Column({ type: 'bigint', name: 'student_id' })
  @Index()
  studentId: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiPropertyOptional({
    description: 'Teacher ID (if issued to teacher)',
    example: 5,
  })
  @Column({ type: 'bigint', nullable: true, name: 'teacher_id' })
  teacherId: number;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @ApiProperty({ description: 'Date of issue', example: '2024-05-15' })
  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @ApiPropertyOptional({
    description: 'Date of issue in BS',
    example: '2081-02-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'issue_date_bs',
  })
  issueDateBs: string;

  @ApiProperty({ description: 'Due date for return', example: '2024-05-29' })
  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Due date in BS', example: '2081-02-15' })
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'due_date_bs' })
  dueDateBs: string;

  @ApiPropertyOptional({
    description: 'Actual return date',
    example: '2024-05-30',
  })
  @Column({ type: 'date', nullable: true, name: 'return_date' })
  returnDate: Date;

  @ApiPropertyOptional({
    description: 'Actual return date in BS',
    example: '2081-02-16',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'return_date_bs',
  })
  returnDateBs: string;

  // Fine Calculation (NPR)
  @ApiProperty({
    description: 'Fine amount if overdue',
    example: 10.0,
    default: 0,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'fine_amount',
  })
  fineAmount: number;

  @ApiProperty({
    description: 'Number of days overdue',
    example: 1,
    default: 0,
  })
  @Column({ type: 'int', default: 0, name: 'days_overdue' })
  daysOverdue: number;

  // Status
  @ApiProperty({
    description: 'Status of the issue',
    enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST'],
    default: 'ISSUED',
  })
  @Column({
    type: 'enum',
    enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST'],
    default: 'ISSUED',
    name: 'status',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Remarks',
    example: 'Returned with minor damage',
  })
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'remarks' })
  remarks: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
