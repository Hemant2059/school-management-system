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
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';

@Entity({ name: 'sections' })
@Unique(['schoolId', 'classId', 'sectionCode'])
@Index(['schoolId', 'isActive'])
export class Section {
  @ApiProperty({ description: 'Database ID for the section', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'section_id' })
  sectionId: number;

  @ManyToOne(() => School, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'School ID', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => AcademicClass, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'class_id' })
  academicClass: AcademicClass;

  @ApiProperty({ description: 'Academic Class ID', example: 5 })
  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @ApiProperty({ description: 'Section name', example: 'Section A' })
  @Column({ type: 'varchar', length: 100, name: 'section_name' })
  sectionName: string;

  @ApiProperty({ description: 'Section code', example: 'SEC-A' })
  @Column({ type: 'varchar', length: 20, name: 'section_code' })
  sectionCode: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @Column({ type: 'int', default: 0, name: 'section_order' })
  sectionOrder: number;

  @ApiPropertyOptional({ description: 'Student capacity', example: 40 })
  @Column({ type: 'int', nullable: true, name: 'capacity' })
  capacity: number;

  @ApiPropertyOptional({
    description: 'Current student count (auto-calculated)',
  })
  @Column({ type: 'int', default: 0, name: 'student_count' })
  studentCount: number;

  @ApiPropertyOptional({ description: 'Homeroom teacher ID' })
  @Column({ type: 'bigint', nullable: true, name: 'homeroom_teacher_id' })
  homeroomTeacherId: number;

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

  @OneToMany(() => Enrollment, (enrollment) => enrollment.section)
  enrollments: Enrollment[];
}
