import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Fee } from '../../fee/entities/fee.entity';
import { Student } from '../../student/entities/student.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Exam } from '../../exam/entities/exam.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { User } from '../../user/entities/user.entity';
import { Section } from '../../section/entities/section.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';

@Entity({ name: 'schools' })
@Unique(['schoolCode'])
@Index(['isActive', 'schoolType'])
export class School {
  @ApiProperty({ description: 'Database ID for the school', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'school_id' })
  schoolId: number;

  @ApiProperty({
    description: 'Unique school code',
    example: 'SCH-101',
    uniqueItems: true,
  })
  @Column({ type: 'varchar', length: 20, unique: true, name: 'school_code' })
  schoolCode: string;

  @ApiProperty({
    description: 'Official name of the school in English',
    example: 'Everest Public School',
  })
  @Column({ type: 'varchar', length: 255, name: 'school_name' })
  schoolName: string;

  @ApiPropertyOptional({
    description: 'School name in Nepali (Unicode)',
    example: 'एभरेस्ट पब्लिक स्कूल',
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'school_name_nepali',
  })
  schoolNameNepali: string;

  @ApiProperty({
    description: 'School type',
    enum: ['DAY', 'BOARDING', 'DAY_BOARDING'],
    default: 'DAY',
  })
  @Column({
    type: 'enum',
    enum: ['DAY', 'BOARDING', 'DAY_BOARDING'],
    default: 'DAY',
    name: 'school_type',
  })
  schoolType: string;

  @ApiProperty({
    description: 'Ownership type',
    enum: ['PRIVATE', 'COMMUNITY', 'INSTITUTIONAL', 'GOVERNMENT'],
    default: 'PRIVATE',
  })
  @Column({
    type: 'enum',
    enum: ['PRIVATE', 'COMMUNITY', 'INSTITUTIONAL', 'GOVERNMENT'],
    default: 'PRIVATE',
    name: 'ownership_type',
  })
  ownershipType: string;

  @ApiPropertyOptional({
    description: 'Establishment date',
    example: '2050-01-01',
  })
  @Column({ type: 'date', nullable: true, name: 'established_date' })
  establishedDate: Date;

  @ApiPropertyOptional({
    description: 'Establishment date in BS (YYYY-MM-DD)',
    example: '2057-01-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'established_date_bs',
  })
  establishedDateBs: string;

  @ApiPropertyOptional({ description: 'Government registration number' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'registration_number',
  })
  registrationNumber: string;

  @ApiPropertyOptional({ description: 'Educational board affiliation number' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'affiliation_number',
  })
  affiliationNumber: string;

  @ApiPropertyOptional({
    description: 'MOEST School Code (for Nepal government reporting)',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'moest_school_code',
  })
  moestSchoolCode: string;

  @ApiPropertyOptional({ description: 'Province ID (1-7)', example: 3 })
  @Column({ type: 'int', nullable: true, name: 'province_id' })
  provinceId: number;

  @ApiPropertyOptional({ description: 'District ID', example: 27 })
  @Column({ type: 'int', nullable: true, name: 'district_id' })
  districtId: number;

  @ApiPropertyOptional({
    description: 'Municipality/Local Body ID',
    example: 100,
  })
  @Column({ type: 'int', nullable: true, name: 'municipality_id' })
  municipalityId: number;

  @ApiPropertyOptional({ description: 'Ward number', example: 5 })
  @Column({ type: 'int', nullable: true, name: 'ward_no' })
  wardNo: number;

  @ApiPropertyOptional({
    description: 'Locality name (Tole)',
    example: 'Baluwatar',
  })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tole' })
  tole: string;

  @ApiPropertyOptional({
    description: 'Locality name in Nepali',
    example: 'बालुवाटार',
  })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tole_nepali' })
  toleNepali: string;

  @ApiPropertyOptional({ description: 'Street address' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'street_address',
  })
  streetAddress: string;

  @ApiPropertyOptional({ description: 'Street address in Nepali' })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'street_address_nepali',
  })
  streetAddressNepali: string;

  @ApiPropertyOptional({
    description: 'Primary phone number',
    example: '01-4412345',
  })
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone' })
  phone: string;

  @ApiPropertyOptional({ description: 'Mobile number', example: '9841234567' })
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile' })
  mobile: string;

  @ApiPropertyOptional({
    description: 'Official email',
    example: 'info@school.edu.np',
  })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'email' })
  email: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://school.edu.np',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'website' })
  website: string;

  @ApiProperty({ description: 'Academic year start month (1-12)', default: 4 })
  @Column({ type: 'int', default: 4, name: 'academic_year_start_month' })
  academicYearStartMonth: number;

  @ApiProperty({ description: 'Currency code', default: 'NPR' })
  @Column({ type: 'varchar', length: 3, default: 'NPR', name: 'currency_code' })
  currencyCode: string;

  @ApiProperty({ description: 'Timezone', default: 'Asia/Kathmandu' })
  @Column({
    type: 'varchar',
    length: 50,
    default: 'Asia/Kathmandu',
    name: 'timezone',
  })
  timezone: string;

  @ApiProperty({
    description: 'Language preference',
    enum: ['EN', 'NE', 'BOTH'],
    default: 'BOTH',
  })
  @Column({
    type: 'enum',
    enum: ['EN', 'NE', 'BOTH'],
    default: 'BOTH',
    name: 'language_preference',
  })
  languagePreference: string;

  @ApiProperty({ description: 'Whether the school is active', default: true })
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

  @OneToMany(() => Fee, (fee) => fee.school)
  fees: Fee[];

  @OneToMany(() => Student, (student) => student.school)
  students: Student[];

  @OneToMany(() => Teacher, (teacher) => teacher.school)
  teachers: Teacher[];

  @OneToMany(() => AcademicClass, (academicClass) => academicClass.school)
  academicClasses: AcademicClass[];

  @OneToMany(() => Subject, (subject) => subject.school)
  subjects: Subject[];

  @OneToMany(() => Section, (section) => section.school)
  sections: Section[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.school)
  enrollments: Enrollment[];

  @OneToMany(() => Exam, (exam) => exam.school)
  exams: Exam[];

  @OneToMany(() => Attendance, (attendance) => attendance.school)
  attendances: Attendance[];

  @OneToMany(() => User, (user) => user.school)
  users: User[];
}
