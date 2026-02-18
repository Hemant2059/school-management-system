import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'fee_structures' })
export class FeeStructure {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'structure_id' })
  structureId: number;

  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @Column({ type: 'bigint', name: 'academic_year_id' })
  academicYearId: number;

  @Column({ type: 'bigint', name: 'class_id' })
  @Index()
  classId: number;

  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  sectionId: number;

  @Column({ type: 'bigint', name: 'category_id' })
  categoryId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount' })
  amount: number;

  @Column({ type: 'boolean', default: false, name: 'is_installment' })
  isInstallment: boolean;

  @Column({ type: 'int', default: 1, name: 'installment_count' })
  installmentCount: number;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_govt_mandated_free_seat',
  })
  isGovtMandatedFreeSeat: boolean; // 10% mandatory quota tracking

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
