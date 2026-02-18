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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Staff } from './staff.entity';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'payroll' })
export class Payroll {
  @ApiProperty({
    description: 'Database ID for the payroll record',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'payroll_id' })
  payrollId: number;

  @ApiProperty({
    description: 'School ID this payroll record belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Staff member ID', example: 1 })
  @Column({ type: 'bigint', name: 'staff_id' })
  @Index()
  staffId: number;

  @ApiProperty({ description: 'Payroll month (1-12)', example: 4 })
  @Column({ type: 'smallint', name: 'payroll_month' })
  payrollMonth: number;

  @ApiProperty({ description: 'Payroll year', example: 2024 })
  @Column({ type: 'smallint', name: 'payroll_year' })
  payrollYear: number;

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

  @ApiPropertyOptional({
    description: 'Salary month in BS',
    example: '2081-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'salary_month_bs',
  })
  salaryMonthBs: string;

  @ApiProperty({ description: 'Basic salary amount', example: 40000.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'basic_salary' })
  basicSalary: number;

  @ApiPropertyOptional({ description: 'House rent allowance', example: 2000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'house_rent_allowance',
  })
  houseRentAllowance: number;

  @ApiPropertyOptional({ description: 'Transport allowance', example: 1000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'transport_allowance',
  })
  transportAllowance: number;

  @ApiPropertyOptional({ description: 'Medical allowance', example: 1000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'medical_allowance',
  })
  medicalAllowance: number;

  @ApiPropertyOptional({ description: 'Other allowances', example: 1000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'other_allowances',
  })
  otherAllowances: number;

  @ApiProperty({ description: 'Total allowances', example: 5000.0, default: 0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'allowances',
  })
  allowances: number;

  @ApiProperty({ description: 'Gross salary', example: 45000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'gross_salary',
  })
  grossSalary: number;

  @ApiPropertyOptional({ description: 'CIT deduction', example: 1000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'cit_deduction',
  })
  citDeduction: number;

  @ApiPropertyOptional({ description: 'Provident fund', example: 4000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'provident_fund',
  })
  providentFund: number;

  @ApiPropertyOptional({
    description: 'SSF Employee Contribution',
    example: 2000.0,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'ssf_employee_contribution',
  })
  ssfEmployeeContribution: number;

  @ApiPropertyOptional({
    description: 'SSF Employer Contribution',
    example: 2000.0,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'ssf_employer_contribution',
  })
  ssfEmployerContribution: number;

  @ApiPropertyOptional({ description: 'Tax deduction', example: 500.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'tax_deduction',
  })
  taxDeduction: number;

  @ApiPropertyOptional({ description: 'Other deductions', example: 500.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'other_deductions',
  })
  otherDeductions: number;

  @ApiProperty({ description: 'Total deductions', example: 2000.0, default: 0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'deductions',
  })
  deductions: number;

  @ApiProperty({ description: 'Total deductions calculation', example: 8000.0 })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_deductions',
  })
  totalDeductions: number;

  @ApiProperty({ description: 'Net salary payable', example: 43000.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_salary' })
  netSalary: number;

  @ApiProperty({
    description: 'Payment status',
    enum: ['PENDING', 'PROCESSED', 'PAID', 'CANCELLED'],
    default: 'PENDING',
  })
  @Column({
    type: 'enum',
    enum: ['PENDING', 'PROCESSED', 'PAID', 'CANCELLED'],
    default: 'PENDING',
    name: 'payment_status',
  })
  paymentStatus: string;

  @ApiPropertyOptional({
    description: 'Date when payroll was paid',
    example: '2024-05-02',
  })
  @Column({ type: 'date', nullable: true, name: 'payment_date' })
  paymentDate: Date;

  @ApiPropertyOptional({
    description: 'Payment date in BS',
    example: '2081-01-20',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'payment_date_bs',
  })
  paymentDateBs: string;

  @ApiProperty({ description: 'Is tax exempt?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_tax_exempt' })
  isTaxExempt: boolean;

  @ApiProperty({ description: 'Is paid?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_paid' })
  isPaid: boolean;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'Bank Transfer',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Bank transaction reference' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'transaction_reference',
  })
  transactionReference: string;

  @ApiPropertyOptional({
    description: 'Personal Account Number (PAN)',
    example: '600123456',
  })
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'pan_number' })
  panNumber: string;

  @ApiPropertyOptional({ description: 'Additional remarks' })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'remarks' })
  remarks: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'staff_id' })
  staff: Staff;
}
