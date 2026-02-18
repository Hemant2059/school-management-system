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
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'fee_categories' })
export class FeeCategory {
  @ApiProperty({ description: 'Database ID for the fee category', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'category_id' })
  categoryId: number;

  @ApiProperty({
    description: 'School ID this fee category belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({
    description: 'Name of the fee category',
    example: 'Tuition Fee',
  })
  @Column({ type: 'varchar', length: 100, name: 'category_name' })
  categoryName: string;

  @ApiProperty({
    description: 'Unique code for the category',
    example: 'TUIT',
    uniqueItems: true,
  })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'category_code' })
  categoryCode: string;

  @ApiProperty({
    description: 'General type/classification of the fee',
    enum: [
      'TUITION',
      'ADMISSION',
      'EXAMINATION',
      'TRANSPORT',
      'HOSTEL',
      'MISC',
      'FINE',
      'LIBRARY',
      'SPORTS',
      'LAB',
    ],
  })
  @Column({
    type: 'enum',
    enum: [
      'TUITION',
      'ADMISSION',
      'EXAMINATION',
      'TRANSPORT',
      'HOSTEL',
      'MISC',
      'FINE',
      'LIBRARY',
      'SPORTS',
      'LAB',
    ],
    name: 'category_type',
  })
  categoryType: string;

  @ApiPropertyOptional({ description: 'Description of the fee category' })
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'description' })
  description: string;

  @ApiProperty({ description: 'Whether the category is active', default: true })
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
}
