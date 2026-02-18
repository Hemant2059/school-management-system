import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'transport_fees' })
export class TransportFee {
  @ApiProperty({ description: 'Database ID for the transport fee', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'fee_id' })
  feeId: number;

  @ApiProperty({
    description: 'School ID this transport fee belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Route ID', example: 1 })
  @Column({ type: 'bigint', name: 'route_id' })
  @Index()
  routeId: number;

  @ApiPropertyOptional({
    description: 'Section ID (optional, null for all sections)',
    example: 2,
  })
  @Column({ type: 'bigint', nullable: true, name: 'section_id' })
  sectionId: number;

  @ApiProperty({ description: 'Monthly transport fee', example: 1500.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'monthly_fee' })
  monthlyFee: number;

  @ApiPropertyOptional({
    description: 'One-time admission fee',
    example: 5000.0,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'admission_fee',
  })
  admissionFee: number;

  @ApiProperty({ description: 'Currency', default: 'NPR', example: 'NPR' })
  @Column({ type: 'varchar', length: 50, default: 'NPR', name: 'currency' })
  currency: string;

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
