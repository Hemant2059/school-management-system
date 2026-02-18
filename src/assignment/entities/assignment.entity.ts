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
import { ApiProperty } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Section } from '../../section/entities/section.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';

@Entity({ name: 'assignments' })
export class Assignment {
  @ApiProperty({ description: 'Database ID for the assignment', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'assignment_id' })
  assignmentId: number;

  @ApiProperty({
    description: 'School ID this assignment belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Assignment title', example: 'Algebra Homework' })
  title: string;

  @Column({ type: 'varchar', length: 500, name: 'description' })
  description: string;

  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @ManyToOne(() => AcademicClass)
  @JoinColumn({ name: 'class_id' })
  class: AcademicClass;

  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  sectionId: number;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Column({ type: 'bigint', name: 'subject_id' })
  @Index()
  subjectId: number;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ type: 'bigint', name: 'teacher_id' })
  teacherId: number;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacher_id' })
  teacher: Teacher;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'due_date_bs' })
  dueDateBs: string;

  @Column({ type: 'int', default: 100, name: 'total_marks' })
  totalMarks: number;

  @Column({ type: 'boolean', default: true, name: 'is_published' })
  isPublished: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
