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

@Entity({ name: 'books' })
export class Book {
  @ApiProperty({ description: 'Database ID for the book', example: 1 })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'book_id' })
  bookId: number;

  @ApiProperty({ description: 'School ID this book belongs to', example: 1 })
  @Column({ type: 'bigint', name: 'school_id' })
  @Index()
  schoolId: number;

  @ManyToOne(() => School)
  @JoinColumn({ name: 'school_id' })
  school: School;

  // English Details
  @ApiProperty({
    description: 'Book title in English',
    example: 'Advanced Mathematics for Class 10',
  })
  @Column({ type: 'varchar', length: 255, name: 'title_en' })
  titleEn: string;

  @ApiPropertyOptional({
    description: 'Author name in English',
    example: 'Dr. Ramesh Kumar Sharma',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'author_en' })
  authorEn: string;

  @ApiPropertyOptional({
    description: 'Publisher name in English',
    example: 'Ekta Books Nepal',
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'publisher_en',
  })
  publisherEn: string;

  // Nepali Details (Unicode Devanagari)
  @ApiPropertyOptional({
    description: 'Book title in Nepali',
    example: 'कक्षा १० को लागि उन्नत गणित',
  })
  @Column({ type: 'varchar', length: 300, nullable: true, name: 'title_np' })
  titleNp: string;

  @ApiPropertyOptional({
    description: 'Author name in Nepali',
    example: 'डा. रमेश कुमार शर्मा',
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'author_np' })
  authorNp: string;

  @ApiPropertyOptional({
    description: 'Publisher name in Nepali',
    example: 'एकता बुक्स नेपाल',
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'publisher_np',
  })
  publisherNp: string;

  // Book Classification
  @ApiProperty({ description: 'ISBN number', example: '978-99946-000-1-2' })
  @Column({ type: 'varchar', length: 100, name: 'isbn' })
  @Index()
  isbn: string;

  @ApiProperty({
    description: 'Unique book code for library',
    example: 'BOOK-2024-001',
  })
  @Column({ type: 'varchar', length: 50, name: 'book_code' })
  @Index()
  bookCode: string;

  @ApiProperty({
    description: 'Type/category of book',
    enum: [
      'TEXTBOOK',
      'REFERENCE',
      'NOVEL',
      'ENCYCLOPEDIA',
      'MAGAZINE',
      'OTHER',
    ],
    example: 'TEXTBOOK',
  })
  @Column({
    type: 'enum',
    enum: [
      'TEXTBOOK',
      'REFERENCE',
      'NOVEL',
      'ENCYCLOPEDIA',
      'MAGAZINE',
      'OTHER',
    ],
    name: 'book_type',
  })
  bookType: string;

  // Nepal Curriculum Specific
  @ApiProperty({ description: 'Is SEE reference book?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_see_reference' })
  isSeeReference: boolean;

  @ApiProperty({ description: 'Is NEB reference book?', default: false })
  @Column({ type: 'boolean', default: false, name: 'is_neb_reference' })
  isNebReference: boolean;

  @ApiPropertyOptional({ description: 'Curriculum level', example: 'Grade 10' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'curriculum_level',
  })
  curriculumLevel: string;

  @ApiPropertyOptional({ description: 'Subject area', example: 'Mathematics' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'subject' })
  subject: string;

  // Acquisition Details
  @ApiProperty({ description: 'Acquisition date', example: '2024-01-15' })
  @Column({ type: 'date', name: 'acquisition_date' })
  acquisitionDate: Date;

  @ApiPropertyOptional({
    description: 'Acquisition date in BS',
    example: '2080-10-01',
  })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'acquisition_date_bs',
  })
  acquisitionDateBs: string;

  @ApiProperty({ description: 'Price of the book', example: 450.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price' })
  price: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'NPR' })
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'currency' })
  currency: string;

  // Physical Details
  @ApiProperty({ description: 'Total copies available', default: 1 })
  @Column({ type: 'int', default: 1, name: 'total_copies' })
  totalCopies: number;

  @ApiProperty({ description: 'Number of copies issued', default: 0 })
  @Column({ type: 'int', default: 0, name: 'issued_copies' })
  issuedCopies: number;

  @ApiProperty({ description: 'Number of damaged copies', default: 0 })
  @Column({ type: 'int', default: 0, name: 'damaged_copies' })
  damagedCopies: number;

  @ApiPropertyOptional({ description: 'Book description' })
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'description' })
  description: string;

  @ApiPropertyOptional({
    description: 'Language of the book',
    example: 'Nepali',
  })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'language' })
  language: string;

  @ApiPropertyOptional({ description: 'Edition', example: '5th' })
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'edition' })
  edition: string;

  @ApiPropertyOptional({ description: 'Number of pages', example: 300 })
  @Column({ type: 'int', nullable: true, name: 'pages' })
  pages: number;

  // Status
  @ApiProperty({ description: 'Is active?', default: true })
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
