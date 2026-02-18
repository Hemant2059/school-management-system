import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Student } from '../../student/entities/student.entity';
import { FeeInstallment } from './fee-installment.entity';
import { FeeTransaction } from './fee-transaction.entity';

@Entity('fees')
@Index(['schoolId', 'studentId', 'status']) // Fast lookup for pending fees
export class Fee {
  @ApiProperty({ description: 'Database ID for the fee record', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'fee_id' })
  feeId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  schoolId: number;

  @ApiProperty({ description: 'Student ID', example: 101 })
  @Column({ type: 'bigint', name: 'student_id' })
  studentId: number;

  @ApiProperty({
    description: 'Type of fee (e.g., Admission, Tuition)',
    example: 'Tuition Fee',
  })
  @Column({ type: 'varchar', length: 100, name: 'fee_type' })
  feeType: string;

  @ApiProperty({ description: 'Base fee amount', example: 5000.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Discount applied to the fee',
    example: 500.0,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'discount_amount',
  })
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Fine amount for late payment',
    example: 100.0,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'fine_amount',
  })
  fineAmount?: number;

  @ApiProperty({
    description: 'Total amount after discount and fine',
    example: 4600.0,
  })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Payment due date', example: '2024-05-15' })
  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @ApiProperty({
    description: 'Current payment status',
    enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
    default: 'PENDING',
  })
  @Column({
    type: 'enum',
    enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'],
    default: 'PENDING',
    name: 'status',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Date of payment',
    example: '2024-05-10',
  })
  @Column({ type: 'date', nullable: true, name: 'payment_date' })
  paymentDate?: Date;

  @ApiPropertyOptional({
    description: 'Payment method used',
    example: 'Khalti',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Unique transaction ID' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'transaction_id',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Nepali fiscal year',
    example: '2081/2082',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'fiscal_year_bs',
  })
  fiscalYearBs: string;

  @ApiProperty({
    description: 'Scholarship percentage applied (0-100)',
    example: 10.0,
    default: 0,
  })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'scholarship_percent',
  })
  scholarshipPercent: number;

  @ApiPropertyOptional({ description: 'Additional notes regarding the fee' })
  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes?: string;

  @ApiProperty({
    description: 'Whether the fee record is active',
    default: true,
  })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
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

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy?: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy?: number;

  @ManyToOne(() => School, (school) => (school as any).fees)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Student, (student) => student.fees)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => FeeTransaction, (transaction) => transaction.fee)
  transactions: FeeTransaction[];

  @OneToMany(() => FeeInstallment, (installment) => installment.fee)
  installments: FeeInstallment[];
}
