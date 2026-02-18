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
  Unique,
} from 'typeorm';
import { School } from '../../school/entities/school.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity({ name: 'teachers' })
@Unique(['teacherCode'])
@Unique(['employeeId', 'schoolId'])
@Index(['schoolId', 'isActive', 'currentStatus'])
export class Teacher {
  @ApiProperty({ description: 'Database ID for the teacher', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'teacher_id' })
  teacherId: number;

  @ApiProperty({ description: 'School ID this teacher belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Teacher code', example: 'TCH-001' })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'teacher_code' })
  teacherCode: string;

  @ApiProperty({ description: 'Employee ID', example: 'EMP-2024-001' })
  @Column({ type: 'varchar', length: 50, name: 'employee_id' })
  employeeId: string;

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

  @ApiPropertyOptional({ description: 'Display name' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'display_name',
  })
  displayName: string;

  @ApiProperty({ description: 'Date of birth', example: '1985-01-15' })
  @Column({ type: 'date', nullable: true, name: 'date_of_birth' })
  dateOfBirth: Date;

  @ApiPropertyOptional({
    description: 'Date of birth in BS',
    example: '2041-10-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'date_of_birth_bs',
  })
  dateOfBirthBs: string;

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
  gender: string;

  @ApiPropertyOptional({ description: 'Blood group', example: 'O+' })
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'blood_group' })
  bloodGroup: string;

  @ApiPropertyOptional({ description: 'Nationality', example: 'Nepali' })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'nationality',
  })
  nationality: string;

  @ApiPropertyOptional({ description: 'Religion', example: 'Hindu' })
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'religion' })
  religion: string;

  @ApiPropertyOptional({
    description: 'Highest qualification',
    example: 'Masters in Education',
  })
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'highest_qualification',
  })
  highestQualification: string;

  @ApiPropertyOptional({
    description: 'Specialization',
    example: 'Mathematics',
  })
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'specialization',
  })
  specialization: string;

  @ApiPropertyOptional({ description: 'University/Board', example: 'TU' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'university_board',
  })
  universityBoard: string;

  @ApiPropertyOptional({ description: 'Passing year', example: 2010 })
  @Column({ type: 'int', nullable: true, name: 'passing_year' })
  passingYear: number;

  @ApiPropertyOptional({ description: 'Teaching license number' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'teaching_license_number',
  })
  teachingLicenseNumber: string;

  @ApiPropertyOptional({ description: 'License expiry date' })
  @Column({ type: 'date', nullable: true, name: 'license_expiry_date' })
  licenseExpiryDate: Date;

  @ApiPropertyOptional({
    description: 'Personal mobile',
    example: '9841234567',
  })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'personal_mobile',
  })
  personalMobile: string;

  @ApiPropertyOptional({ description: 'Official mobile' })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'official_mobile',
  })
  officialMobile: string;

  @ApiPropertyOptional({
    description: 'Personal email',
    example: 'teacher@email.com',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'personal_email',
  })
  personalEmail: string;

  @ApiPropertyOptional({
    description: 'Official email',
    example: 'teacher@school.edu.np',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'official_email',
  })
  officialEmail: string;

  @ApiPropertyOptional({ description: 'Permanent province ID' })
  @Column({ type: 'int', nullable: true, name: 'permanent_province_id' })
  permanentProvinceId: number;

  @ApiPropertyOptional({ description: 'Permanent district ID' })
  @Column({ type: 'int', nullable: true, name: 'permanent_district_id' })
  permanentDistrictId: number;

  @ApiPropertyOptional({ description: 'Permanent municipality ID' })
  @Column({ type: 'int', nullable: true, name: 'permanent_municipality_id' })
  permanentMunicipalityId: number;

  @ApiPropertyOptional({ description: 'Permanent ward number' })
  @Column({ type: 'int', nullable: true, name: 'permanent_ward_no' })
  permanentWardNo: number;

  @ApiPropertyOptional({ description: 'Permanent tole (English)' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'permanent_tole_en',
  })
  permanentToleEn: string;

  @ApiPropertyOptional({ description: 'Permanent address (English)' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'permanent_address_en',
  })
  permanentAddressEn: string;

  @ApiPropertyOptional({ description: 'Permanent tole (Nepali)' })
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    name: 'permanent_tole_np',
  })
  permanentToleNp: string;

  @ApiPropertyOptional({ description: 'Permanent address (Nepali)' })
  @Column({
    type: 'varchar',
    length: 300,
    nullable: true,
    name: 'permanent_address_np',
  })
  permanentAddressNp: string;

  @ApiProperty({ description: 'Joining date', example: '2020-01-01' })
  @Column({ type: 'date', name: 'joining_date' })
  joiningDate: Date;

  @ApiPropertyOptional({ description: 'Joining date in BS' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'joining_date_bs',
  })
  joiningDateBs: string;

  @ApiProperty({
    description: 'Employment type',
    enum: ['PERMANENT', 'CONTRACTUAL', 'PART_TIME', 'ADJUNCT', 'VISITING'],
    default: 'PERMANENT',
  })
  @Column({
    type: 'enum',
    enum: ['PERMANENT', 'CONTRACTUAL', 'PART_TIME', 'ADJUNCT', 'VISITING'],
    default: 'PERMANENT',
    name: 'employment_type',
  })
  employmentType: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Science' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'department' })
  department: string;

  @ApiPropertyOptional({
    description: 'Designation',
    example: 'Senior Teacher',
  })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'designation' })
  designation: string;

  @ApiProperty({
    description: 'Current status',
    enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'],
    default: 'ACTIVE',
  })
  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'],
    default: 'ACTIVE',
    name: 'current_status',
  })
  @Index()
  currentStatus: string;

  @ApiProperty({ description: 'Is active?', default: true })
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

  getFullName(language: 'en' | 'np' = 'en'): string {
    if (language === 'np' && this.firstNameNp) {
      return `${this.firstNameNp} ${this.middleNameNp ?? ''} ${this.lastNameNp}`.trim();
    }
    return `${this.firstNameEn} ${this.middleNameEn ?? ''} ${this.lastNameEn}`.trim();
  }
}
