import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'subjects' })
@Unique(['schoolId', 'subjectCode'])
@Index(['schoolId', 'isActive'])
@Index(['schoolId', 'subjectType'])
export class Subject {
  @ApiProperty({ description: 'Database ID for the subject', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'subject_id' })
  subjectId: number;

  @ApiProperty({ description: 'School ID this subject belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Subject name', example: 'Mathematics' })
  @Column({ type: 'varchar', length: 200, name: 'subject_name' })
  subjectName: string;

  @ApiPropertyOptional({
    description: 'Subject name in Nepali',
    example: 'गणित',
  })
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'subject_name_nepali',
  })
  subjectNameNepali: string;

  @ApiProperty({ description: 'Subject code', example: 'MATH-101' })
  @Column({ type: 'varchar', length: 50, name: 'subject_code' })
  @Index()
  subjectCode: string;

  @ApiProperty({
    description: 'Subject type',
    enum: ['COMPULSORY', 'ELECTIVE', 'OPTIONAL', 'ADDITIONAL'],
    default: 'COMPULSORY',
    example: 'COMPULSORY',
  })
  @Column({
    type: 'enum',
    enum: ['COMPULSORY', 'ELECTIVE', 'OPTIONAL', 'ADDITIONAL'],
    default: 'COMPULSORY',
    name: 'subject_type',
  })
  @Index()
  subjectType: string;

  @ApiPropertyOptional({
    description: 'Subject group',
    enum: ['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'],
    example: 'SCIENCE',
  })
  @Column({
    type: 'enum',
    enum: ['SCIENCE', 'MANAGEMENT', 'HUMANITIES', 'EDUCATION', 'OTHER'],
    nullable: true,
    name: 'subject_group',
  })
  subjectGroup: string;

  @ApiProperty({ description: 'Credit hours', example: 4.0, default: 0 })
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 0,
    name: 'credit_hours',
  })
  creditHours: number;

  @ApiProperty({ description: 'Is theory available?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_theory' })
  isTheory: boolean;

  @ApiProperty({ description: 'Is practical available?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_practical' })
  isPractical: boolean;

  @ApiProperty({ description: 'Full marks for theory', example: 100 })
  @Column({ type: 'int', nullable: true, name: 'theory_full_marks' })
  theoryFullMarks: number;

  @ApiProperty({ description: 'Pass marks for theory', example: 35 })
  @Column({ type: 'int', nullable: true, name: 'theory_pass_marks' })
  theoryPassMarks: number;

  @ApiProperty({ description: 'Full marks for practical', example: 25 })
  @Column({ type: 'int', nullable: true, name: 'practical_full_marks' })
  practicalFullMarks: number;

  @ApiProperty({ description: 'Pass marks for practical', example: 10 })
  @Column({ type: 'int', nullable: true, name: 'practical_pass_marks' })
  practicalPassMarks: number;

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
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
