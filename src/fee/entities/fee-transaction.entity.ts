import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Fee } from './fee.entity';

@Entity({ name: 'fee_transactions' })
@Index(['schoolId', 'transactionDate']) // Daily collection report
export class FeeTransaction {
  @ApiProperty({ description: 'Database ID for the transaction', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'transaction_id' })
  transactionId: number;

  @ApiProperty({
    description: 'School ID this transaction belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ type: 'bigint', name: 'student_fee_id' })
  @Index()
  studentFeeId: number;

  @ManyToOne(() => Fee, (fee) => fee.transactions)
  @JoinColumn({ name: 'student_fee_id' })
  fee: Fee;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount' })
  amount: number;

  @Column({
    type: 'enum',
    enum: [
      'CASH',
      'BANK',
      'CHEQUE',
      'ESEWA',
      'KHALTI',
      'FONEPAY',
      'CONNECTIPS',
      'IMEPAY',
      'OTHER',
    ],
    name: 'payment_method',
  })
  paymentMethod: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'transaction_reference',
  })
  transactionReference: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'bank_name' })
  bankName: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'cheque_number',
  })
  chequeNumber: string;

  @Column({ type: 'bigint', name: 'received_by' })
  receivedBy: number;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'receipt_number' })
  receiptNumber: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'remarks' })
  remarks: string;

  @Column({ type: 'boolean', default: true, name: 'is_verified' })
  isVerified: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'transaction_date' })
  transactionDate: Date;
}
