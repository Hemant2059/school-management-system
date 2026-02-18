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
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'guardians' })
export class Guardian {
  @ApiProperty({ description: 'Database ID for the guardian', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'guardian_id' })
  guardianId: number;

  @ApiProperty({
    description: 'School ID this guardian belongs to',
    example: 1,
  })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiPropertyOptional({
    description: 'User ID associated with this guardian',
    example: 1,
  })
  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // === Guardian Identification ===
  @Column({ type: 'varchar', length: 50, unique: true, name: 'guardian_code' })
  guardianCode: string;

  // === Personal Information (Bilingual) ===

  // English Names
  @Column({ type: 'varchar', length: 100, name: 'first_name_en' })
  firstNameEn: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'middle_name_en',
  })
  middleNameEn: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name_en' })
  lastNameEn: string;

  // Nepali Names
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'first_name_np',
  })
  firstNameNp: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'middle_name_np',
  })
  middleNameNp: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'last_name_np',
  })
  lastNameNp: string;

  // Display Name (Auto-generated)
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'display_name',
  })
  displayName: string;

  // Relation to student
  @Column({
    type: 'enum',
    enum: [
      'FATHER',
      'MOTHER',
      'BROTHER',
      'SISTER',
      'GRANDFATHER',
      'GRANDMOTHER',
      'UNCLE',
      'AUNT',
      'GUARDIAN',
      'OTHER',
    ],
    name: 'relation_to_student',
  })
  relationToStudent: string;

  // Occupation
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'occupation' })
  occupation: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'organization',
  })
  organization: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'designation' })
  designation: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'education_level',
  })
  educationLevel: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    name: 'annual_income',
  })
  annualIncome: number;

  // === Contact Information ===
  @Column({ type: 'varchar', length: 20, name: 'mobile' })
  @Index()
  mobile: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'alternate_mobile',
  })
  alternateMobile: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'email' })
  @Index()
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'whatsapp_number',
  })
  whatsappNumber: string;

  // === Address (Bilingual) ===

  // English Address
  @Column({ type: 'int', nullable: true, name: 'province_id' })
  provinceId: number;

  @Column({ type: 'int', nullable: true, name: 'district_id' })
  districtId: number;

  @Column({ type: 'int', nullable: true, name: 'municipality_id' })
  municipalityId: number;

  @Column({ type: 'int', nullable: true, name: 'ward_no' })
  wardNo: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tole_en' })
  toleEn: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address_en' })
  addressEn: string;

  // Nepali Address
  @Column({ type: 'varchar', length: 150, nullable: true, name: 'tole_np' })
  toleNp: string;

  @Column({ type: 'varchar', length: 300, nullable: true, name: 'address_np' })
  addressNp: string;

  // === Status ===
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // === Audit ===
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  // === Helper Method ===
  getFullName(language: 'en' | 'np' = 'en'): string {
    if (language === 'np' && this.firstNameNp) {
      return `${this.firstNameNp} ${this.middleNameNp || ''} ${this.lastNameNp}`.trim();
    }
    return `${this.firstNameEn} ${this.middleNameEn || ''} ${this.lastNameEn}`.trim();
  }
}
