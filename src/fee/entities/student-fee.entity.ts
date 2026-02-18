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

@Entity({ name: 'student_fees' })
export class StudentFee {
  @ApiProperty({
    description: 'Database ID for the student fee record',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'student_fee_id' })
  studentFeeId: number;

  @ApiProperty({ description: 'School ID this record belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ type: 'bigint', name: 'student_id' })
  @Index()
  studentId: number;

  @Column({ type: 'bigint', name: 'fee_structure_id' })
  feeStructureId: number;

  @Column({ type: 'bigint', name: 'academic_year_id' })
  academicYearId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'paid_amount',
  })
  paidAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'waiver_amount',
  })
  waiverAmount: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PARTIAL', 'PAID', 'WAIVED', 'OVERDUE'],
    default: 'PENDING',
    name: 'status',
  })
  status: string;

  @Column({ type: 'int', default: 1, name: 'installment_number' })
  installmentNumber: number;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
