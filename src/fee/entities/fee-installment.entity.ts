import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Fee } from './fee.entity';
import { School } from '../../school/entities/school.entity';

@Entity('fee_installments')
export class FeeInstallment {
  @ApiProperty({ description: 'Database ID for the installment', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'installment_id' })
  installmentId: number;

  @ApiProperty({
    description: 'School ID this installment belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Associated Fee ID', example: 1 })
  @Column({ type: 'bigint', name: 'fee_id' })
  feeId: number;

  @ApiProperty({
    description: 'Sequential number of the installment',
    example: 1,
  })
  @Column({ type: 'int', name: 'installment_number' })
  installmentNumber: number;

  @ApiProperty({ description: 'Installment amount', example: 2500.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount' })
  amount: number;

  @ApiProperty({ description: 'Payment due date', example: '2024-06-15' })
  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @ApiProperty({
    description: 'Status of the installment',
    enum: ['PENDING', 'PAID', 'OVERDUE'],
    default: 'PENDING',
  })
  @Column({
    type: 'enum',
    enum: ['PENDING', 'PAID', 'OVERDUE'],
    default: 'PENDING',
    name: 'status',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Date when the installment was paid',
    example: '2024-06-10',
  })
  @Column({ type: 'date', nullable: true, name: 'payment_date' })
  paymentDate?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => Fee, (fee) => fee.installments)
  @JoinColumn({ name: 'fee_id' })
  fee: Fee;
}
