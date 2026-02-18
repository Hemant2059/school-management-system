import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { School } from '../../school/entities/school.entity';
import { Fee } from '../../fee/entities/fee.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';
import { IsMoestCasteCode } from '../decorators/caste-validator.decorator';

@Entity({ name: 'students' })
@Unique(['admissionNumber', 'schoolId'])
@Unique(['studentCode'])
@Index(['schoolId', 'isActive', 'currentStatus'])
@Index(['schoolId', 'gender', 'isActive'])
@Index(['schoolId', 'currentStatus', 'createdAt'])
export class Student {
  @ApiProperty({ description: 'Database ID for the student', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'student_id' })
  studentId: number;

  @ManyToOne(() => School, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'School ID', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ApiProperty({ description: 'Unique student code', example: 'STU-1001' })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'student_code' })
  studentCode: string;

  @ApiProperty({ description: 'Admission number', example: 'ADM-2024-001' })
  @Column({
    type: 'varchar',
    length: 50,
    name: 'admission_number',
  })
  @Index()
  admissionNumber: string;

  @ApiPropertyOptional({ description: 'Roll number', example: '10' })
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'roll_number' })
  rollNumber: string;

  @ApiPropertyOptional({ description: 'Bus Stop ID for transport', example: 5 })
  @Column({ type: 'bigint', nullable: true, name: 'bus_stop_id' })
  busStopId: number;

  @ApiPropertyOptional({ description: 'Hostel Room ID', example: 12 })
  @Column({ type: 'bigint', nullable: true, name: 'hostel_room_id' })
  hostelRoomId: number;

  @ApiPropertyOptional({ description: 'Medical conditions', example: 'Asthma' })
  @Column({ type: 'text', nullable: true, name: 'medical_condition' })
  medicalCondition: string;

  @ApiPropertyOptional({
    description: 'Current medications',
    example: 'Inhaler',
  })
  @Column({ type: 'text', nullable: true, name: 'medications' })
  medications: string;

  @ApiPropertyOptional({ description: 'Allergies', example: 'Peanuts' })
  @Column({ type: 'text', nullable: true, name: 'allergies' })
  allergies: string;

  @ApiPropertyOptional({
    description: 'Arbitrary tags for grouping',
    example: ['scout', 'athlete'],
  })
  @Column({ type: 'json', nullable: true, name: 'tags' })
  tags: string[];

  @ApiPropertyOptional({
    description: 'SEE/NEB registration number',
    example: 'REG-556677',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'registration_number',
  })
  registrationNumber: string;

  @ApiProperty({ description: 'First name (English)', example: 'Ram' })
  @Column({ type: 'varchar', length: 100, name: 'first_name_en' })
  firstNameEn: string;

  @ApiPropertyOptional({
    description: 'Middle name (English)',
    example: 'Bahadur',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'middle_name_en',
  })
  middleNameEn: string;

  @ApiProperty({ description: 'Last name (English)', example: 'Sharma' })
  @Column({ type: 'varchar', length: 100, name: 'last_name_en' })
  lastNameEn: string;

  @ApiPropertyOptional({ description: 'First name (Nepali)', example: 'राम' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'first_name_np',
  })
  firstNameNp: string;

  @ApiPropertyOptional({
    description: 'Middle name (Nepali)',
    example: 'बहादुर',
  })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'middle_name_np',
  })
  middleNameNp: string;

  @ApiPropertyOptional({ description: 'Last name (Nepali)', example: 'शर्मा' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'last_name_np',
  })
  lastNameNp: string;

  @ApiPropertyOptional({ description: 'Full name for display' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'display_name',
  })
  displayName: string;

  @ApiProperty({ description: 'Date of birth (AD)', example: '2010-01-01' })
  @Column({ type: 'date', name: 'date_of_birth_ad' })
  dateOfBirthAd: Date;

  @ApiPropertyOptional({
    description: 'Date of birth (BS)',
    example: '2066-09-17',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'date_of_birth_bs',
  })
  dateOfBirthBs: string;

  @ApiPropertyOptional({ description: 'Snapshot of BS date' })
  @Column({ type: 'text', nullable: true, name: 'dob_bs_snapshot' })
  dobBsSnapshot: string;

  @ApiProperty({
    description: 'Gender',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    example: 'MALE',
  })
  @Column({
    type: 'enum',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    name: 'gender',
  })
  @Index()
  gender: string;

  @ApiPropertyOptional({ description: 'Blood group', example: 'O+' })
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'blood_group' })
  bloodGroup: string;

  @ApiPropertyOptional({ description: 'Religion', example: 'Hindu' })
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'religion' })
  religion: string;

  @ApiPropertyOptional({ description: 'Mother tongue', example: 'Nepali' })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'mother_tongue',
  })
  motherTongue: string;

  @ApiPropertyOptional({
    description: 'Caste or Ethnicity',
    example: 'Brahmin',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'caste_ethnicity',
  })
  casteEthnicity: string;

  @ApiPropertyOptional({ description: 'MOEST Caste Code', example: '01A' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'caste_ethnicity_code',
  })
  @IsMoestCasteCode()
  casteEthnicityCode: string;

  @ApiPropertyOptional({ description: 'Citizenship number (encrypted)' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'citizenship_number',
  })
  citizenshipNumber: string;

  @ApiPropertyOptional({ description: 'Birth certificate number (encrypted)' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'birth_certificate_number',
  })
  birthCertificateNumber: string;

  @ApiProperty({
    description: 'Whether this student is in a 10% govt mandated free seat',
    default: false,
  })
  @Column({
    type: 'boolean',
    default: false,
    name: 'is_govt_mandated_free_seat',
  })
  isGovtMandatedFreeSeat: boolean;

  @ApiPropertyOptional({
    description: 'Whether student is from economically disadvantaged family',
  })
  @Column({
    type: 'boolean',
    default: false,
    name: 'is_economically_disadvantaged',
  })
  isEconomicallyDisadvantaged: boolean;

  @ApiPropertyOptional({ description: 'Whether student has disability' })
  @Column({
    type: 'boolean',
    default: false,
    name: 'has_disability',
  })
  hasDisability: boolean;

  @ApiPropertyOptional({ description: 'Disability type if any' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'disability_type',
  })
  disabilityType: string;

  @ApiPropertyOptional({ description: 'Permanent Province ID' })
  @Column({ type: 'int', nullable: true, name: 'permanent_province_id' })
  permanentProvinceId: number;

  @ApiPropertyOptional({ description: 'Permanent District ID' })
  @Column({ type: 'int', nullable: true, name: 'permanent_district_id' })
  permanentDistrictId: number;

  @ApiPropertyOptional({ description: 'Permanent Municipality ID' })
  @Column({ type: 'int', nullable: true, name: 'permanent_municipality_id' })
  permanentMunicipalityId: number;

  @ApiPropertyOptional({ description: 'Permanent Ward Number' })
  @Column({ type: 'int', nullable: true, name: 'permanent_ward_no' })
  permanentWardNo: number;

  @ApiPropertyOptional({ description: 'Permanent Tole (English)' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'permanent_tole_en',
  })
  permanentToleEn: string;

  @ApiPropertyOptional({ description: 'Permanent Address (English)' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'permanent_address_en',
  })
  permanentAddressEn: string;

  @ApiPropertyOptional({ description: 'Permanent Tole (Nepali)' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'permanent_tole_np',
  })
  permanentToleNp: string;

  @ApiPropertyOptional({ description: 'Permanent Address (Nepali)' })
  @Column({
    type: 'varchar',
    length: 300,
    nullable: true,
    name: 'permanent_address_np',
  })
  permanentAddressNp: string;

  @ApiPropertyOptional({ description: 'Temporary Province ID' })
  @Column({ type: 'int', nullable: true, name: 'temporary_province_id' })
  temporaryProvinceId: number;

  @ApiPropertyOptional({ description: 'Temporary District ID' })
  @Column({ type: 'int', nullable: true, name: 'temporary_district_id' })
  temporaryDistrictId: number;

  @ApiPropertyOptional({ description: 'Temporary Municipality ID' })
  @Column({ type: 'int', nullable: true, name: 'temporary_municipality_id' })
  temporaryMunicipalityId: number;

  @ApiPropertyOptional({ description: 'Temporary Ward Number' })
  @Column({ type: 'int', nullable: true, name: 'temporary_ward_no' })
  temporaryWardNo: number;

  @ApiPropertyOptional({ description: 'Temporary Tole (English)' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'temporary_tole_en',
  })
  temporaryToleEn: string;

  @ApiPropertyOptional({ description: 'Temporary Address (English)' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'temporary_address_en',
  })
  temporaryAddressEn: string;

  @ApiPropertyOptional({ description: 'Temporary Tole (Nepali)' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'temporary_tole_np',
  })
  temporaryToleNp: string;

  @ApiPropertyOptional({ description: 'Temporary Address (Nepali)' })
  @Column({
    type: 'varchar',
    length: 300,
    nullable: true,
    name: 'temporary_address_np',
  })
  temporaryAddressNp: string;

  @ApiPropertyOptional({
    description: 'Student mobile number',
    example: '9841000000',
  })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'student_mobile',
  })
  studentMobile: string;

  @ApiPropertyOptional({
    description: 'Student email',
    example: 'student@example.com',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'student_email',
  })
  studentEmail: string;

  @ApiProperty({ description: 'Admission date', example: '2024-04-14' })
  @Column({ type: 'date', name: 'admission_date' })
  admissionDate: Date;

  @ApiProperty({ description: 'Academic class ID at admission' })
  @Column({ type: 'bigint', name: 'admission_class_id' })
  admissionClassId: number;

  @ApiPropertyOptional({ description: 'Previous school name' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'previous_school_name',
  })
  previousSchoolName: string;

  @ApiPropertyOptional({ description: 'Previous school address' })
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'previous_school_address',
  })
  previousSchoolAddress: string;

  @ApiPropertyOptional({ description: 'Transfer certificate (TC) number' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'transfer_certificate_number',
  })
  transferCertificateNumber: string;

  @ApiPropertyOptional({ description: 'TC issue date' })
  @Column({ type: 'date', nullable: true, name: 'tc_issue_date' })
  tcIssueDate: Date;

  @ApiProperty({
    description: 'Current status',
    enum: [
      'ACTIVE',
      'INACTIVE',
      'TRANSFERRED',
      'DROPPED',
      'GRADUATED',
      'SUSPENDED',
    ],
    default: 'ACTIVE',
  })
  @Column({
    type: 'enum',
    enum: [
      'ACTIVE',
      'INACTIVE',
      'TRANSFERRED',
      'DROPPED',
      'GRADUATED',
      'SUSPENDED',
    ],
    default: 'ACTIVE',
    name: 'current_status',
  })
  @Index()
  currentStatus: string;

  @ApiProperty({ description: 'Active status', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
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
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;

  @OneToMany(() => Fee, (fee) => fee.student)
  fees: Fee[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  getFullName(language: 'en' | 'np' = 'en'): string {
    if (language === 'np' && this.firstNameNp) {
      return `${this.firstNameNp} ${this.middleNameNp || ''} ${this.lastNameNp}`.trim();
    }
    return `${this.firstNameEn} ${this.middleNameEn || ''} ${this.lastNameEn}`.trim();
  }
}
