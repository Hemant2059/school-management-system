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
  OneToMany,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Section } from '../../section/entities/section.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';

@Entity({ name: 'classes' })
@Unique(['schoolId', 'classCode'])
@Index(['schoolId', 'isActive'])
@Index(['schoolId', 'classOrder'])
export class AcademicClass {
  @ApiProperty({ description: 'Database ID for the class', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'class_id' })
  classId: number;

  @ManyToOne(() => School, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'School ID', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ApiProperty({ description: 'Class name', example: 'Grade 5' })
  @Column({ type: 'varchar', length: 100, name: 'class_name' })
  className: string;

  @ApiProperty({ description: 'Class code', example: 'G5' })
  @Column({ type: 'varchar', length: 20, name: 'class_code' })
  classCode: string;

  @ApiProperty({ description: 'Class order (1-12)', example: 5 })
  @Column({ type: 'int', name: 'class_order' })
  @Index()
  classOrder: number;

  @ApiProperty({
    description: 'Education level',
    enum: [
      'PRE_PRIMARY',
      'PRIMARY',
      'LOWER_SECONDARY',
      'SECONDARY',
      'HIGHER_SECONDARY',
    ],
    example: 'PRIMARY',
  })
  @Column({
    type: 'enum',
    enum: [
      'PRE_PRIMARY',
      'PRIMARY',
      'LOWER_SECONDARY',
      'SECONDARY',
      'HIGHER_SECONDARY',
    ],
    name: 'education_level',
  })
  @Index()
  educationLevel: string;

  @ApiPropertyOptional({ description: 'Minimum age', example: 9 })
  @Column({ type: 'int', nullable: true, name: 'min_age' })
  minAge: number;

  @ApiPropertyOptional({ description: 'Maximum age', example: 10 })
  @Column({ type: 'int', nullable: true, name: 'max_age' })
  maxAge: number;

  @ApiPropertyOptional({ description: 'Section count (auto-calculated)' })
  @Column({ type: 'int', default: 0, name: 'section_count' })
  sectionCount: number;

  @ApiPropertyOptional({ description: 'Student count (auto-calculated)' })
  @Column({ type: 'int', default: 0, name: 'student_count' })
  studentCount: number;

  @ApiPropertyOptional({ description: 'Maximum students per section' })
  @Column({ type: 'int', nullable: true, name: 'max_students_per_section' })
  maxStudentsPerSection: number;

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

  @OneToMany(() => Section, (section) => section.academicClass)
  sections: Section[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.academicClass)
  enrollments: Enrollment[];
}
