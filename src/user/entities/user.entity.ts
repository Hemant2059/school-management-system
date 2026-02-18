import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserSession } from './user-session.entity';
import { School } from '../../school/entities/school.entity';

@Entity({ name: 'users' })
@Unique(['username'])
@Unique(['email'])
@Unique(['phone'])
@Index(['schoolId', 'userType', 'isActive'])
@Index(['schoolId', 'isActive'])
export class User {
  @ApiProperty({ description: 'Database ID for the user', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_id' })
  userId: number;

  @ApiProperty({ description: 'School ID this user belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School, { eager: false })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ApiProperty({ description: 'Unique username', example: 'john.doe' })
  @Column({ type: 'varchar', length: 100, unique: true, name: 'username' })
  @Index()
  username: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@school.edu.np',
  })
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    name: 'email',
  })
  @Index()
  email: string;

  @ApiPropertyOptional({ description: 'Mobile number', example: '9841234567' })
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
    name: 'phone',
  })
  @Index()
  phone: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @ApiPropertyOptional({ description: 'Full name', example: 'John Doe' })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'full_name' })
  fullName: string;

  @ApiProperty({
    description: 'User role',
    enum: [
      'ADMIN',
      'TEACHER',
      'STAFF',
      'STUDENT',
      'PARENT',
      'ACCOUNTANT',
      'LIBRARIAN',
      'GUARD',
    ],
    example: 'TEACHER',
  })
  @Column({
    type: 'enum',
    enum: [
      'ADMIN',
      'TEACHER',
      'STAFF',
      'STUDENT',
      'PARENT',
      'ACCOUNTANT',
      'LIBRARIAN',
      'GUARD',
    ],
    name: 'user_type',
  })
  @Index()
  userType: string;

  @ApiProperty({ description: 'Is verified?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Is active?', default: true })
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @ApiProperty({ description: 'Failed login attempts', default: 0 })
  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @ApiPropertyOptional({ description: 'Account locked until' })
  @Column({ type: 'timestamp', nullable: true, name: 'locked_until' })
  lockedUntil: Date;

  @ApiProperty({
    example: '2026-02-16T12:00:00Z',
    description: 'Last login timestamp',
  })
  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @ApiProperty({ example: '192.168.1.1', description: 'Last login IP address' })
  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    name: 'last_login_ip',
  })
  lastLoginIp: string;

  @ApiProperty({
    example: 'Mozilla/5.0...',
    description: 'Last login user agent',
  })
  @Column({ type: 'text', nullable: true, name: 'last_login_agent' })
  lastLoginAgent: string;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

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
