import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Student } from '../../student/entities/student.entity';
import { Guardian } from './guardian.entity';

@Entity({ name: 'student_guardians' })
@Index(['studentId', 'guardianId'], { unique: true })
export class StudentGuardian {
  @ApiProperty({ description: 'Database ID', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @ApiProperty({ description: 'School ID', example: 1 })
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

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ApiProperty({ description: 'Guardian ID', example: 50 })
  @Column({ type: 'bigint', name: 'guardian_id' })
  @Index()
  guardianId: number;

  @ManyToOne(() => Guardian)
  @JoinColumn({ name: 'guardian_id' })
  guardian: Guardian;

  @ApiProperty({
    description: 'Relationship type',
    enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
    default: 'GUARDIAN',
  })
  @Column({
    type: 'enum',
    enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'],
    default: 'GUARDIAN',
    name: 'relationship',
  })
  relationship: string;

  @ApiProperty({ description: 'Is primary contact?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_primary_contact' })
  isPrimaryContact: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
