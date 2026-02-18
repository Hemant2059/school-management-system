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

@Entity({ name: 'staff' })
export class Staff {
  @ApiProperty({ description: 'Database ID for the staff member', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'staff_id' })
  staffId: number;

  @ApiProperty({ description: 'School ID this staff belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Associated User ID', example: 10 })
  @Column({ type: 'bigint', unique: true, name: 'user_id' })
  @Index()
  userId: number;

  @ApiProperty({ description: 'First name (English)', example: 'Sita' })
  @Column({ type: 'varchar', length: 100, name: 'first_name_en' })
  firstNameEn: string;

  @ApiPropertyOptional({
    description: 'Middle name (English)',
    example: 'Kumari',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'middle_name_en',
  })
  middleNameEn: string;

  @ApiProperty({ description: 'Last name (English)', example: 'Rai' })
  @Column({ type: 'varchar', length: 100, name: 'last_name_en' })
  lastNameEn: string;

  @ApiPropertyOptional({ description: 'First name (Nepali)', example: 'सीता' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'first_name_np',
  })
  firstNameNp: string;

  @ApiPropertyOptional({
    description: 'Middle name (Nepali)',
    example: 'कुमारी',
  })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'middle_name_np',
  })
  middleNameNp: string;

  @ApiPropertyOptional({ description: 'Last name (Nepali)', example: 'राई' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'last_name_np',
  })
  lastNameNp: string;

  @ApiPropertyOptional({ description: 'Citizenship number' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'citizenship_number',
  })
  citizenshipNumber: string;

  @ApiPropertyOptional({ description: 'PAN number' })
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'pan_number' })
  panNumber: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-01' })
  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth: Date;

  @ApiPropertyOptional({
    description: 'Date of birth in BS',
    example: '2046-09-17',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'date_of_birth_bs',
  })
  dateOfBirthBs: string | null;

  @ApiProperty({
    description: 'Gender',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    example: 'FEMALE',
  })
  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    name: 'gender',
  })
  gender: string;

  @ApiProperty({ description: 'Job position/title', example: 'Senior Teacher' })
  @Column({ type: 'varchar', length: 100, name: 'position' })
  position: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Science' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'department' })
  department: string;

  @ApiProperty({ description: 'Hire date', example: '2020-02-01' })
  @Column({ type: 'date', name: 'hire_date' })
  hireDate: Date;

  @ApiPropertyOptional({
    description: 'Hire date in BS',
    example: '2076-10-18',
  })
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'hire_date_bs' })
  hireDateBs: string | null;

  @ApiPropertyOptional({ description: 'Termination date' })
  @Column({ type: 'date', nullable: true, name: 'termination_date' })
  terminationDate: Date;

  @ApiProperty({
    description: 'Employment type',
    enum: ['PERMANENT', 'CONTRACT', 'PART_TIME', 'CASUAL'],
    default: 'PERMANENT',
  })
  @Column({
    type: 'enum',
    enum: ['PERMANENT', 'CONTRACT', 'PART_TIME', 'CASUAL'],
    default: 'PERMANENT',
    name: 'employment_type',
  })
  employmentType: string;

  @ApiProperty({
    description: 'Whether the staff member is active',
    default: true,
  })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Mobile number', example: '9841000000' })
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile' })
  mobile: string;

  @ApiPropertyOptional({
    description: 'Personal email',
    example: 'staff@example.com',
  })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'email' })
  email: string;

  @ApiPropertyOptional({ description: 'Province ID' })
  @Column({ type: 'int', nullable: true, name: 'province_id' })
  provinceId: number;

  @ApiPropertyOptional({ description: 'District ID' })
  @Column({ type: 'int', nullable: true, name: 'district_id' })
  districtId: number;

  @ApiPropertyOptional({ description: 'Municipality ID' })
  @Column({ type: 'int', nullable: true, name: 'municipality_id' })
  municipalityId: number;

  @ApiPropertyOptional({ description: 'Ward number' })
  @Column({ type: 'int', nullable: true, name: 'ward_no' })
  wardNo: number;

  @ApiPropertyOptional({ description: 'Tole name (English)' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tole_en' })
  toleEn: string;

  @ApiPropertyOptional({ description: 'Tole name (Nepali)' })
  @Column({ type: 'varchar', length: 150, nullable: true, name: 'tole_np' })
  toleNp: string;

  @ApiPropertyOptional({ description: 'Full address in Nepali' })
  @Column({ type: 'varchar', length: 300, nullable: true, name: 'address_np' })
  addressNp: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt?: Date;

  getFullName(language: 'en' | 'np' = 'en'): string {
    if (language === 'np' && this.firstNameNp) {
      return `${this.firstNameNp} ${this.middleNameNp || ''} ${this.lastNameNp}`.trim();
    }
    return `${this.firstNameEn} ${this.middleNameEn || ''} ${this.lastNameEn}`.trim();
  }
}
