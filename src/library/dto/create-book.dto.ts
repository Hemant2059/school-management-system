import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  readonly titleEn: string;

  @ApiProperty({
    description: 'School ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly schoolId: number;

  @ApiPropertyOptional({
    description: 'Author name in English',
    example: 'Dr. Ramesh Kumar Sharma',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly authorEn?: string;

  @ApiPropertyOptional({
    description: 'Publisher name in English',
    example: 'Ekta Books Nepal',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly publisherEn?: string;

  @ApiPropertyOptional({
    description: 'Book title in Nepali',
    example: 'कक्षा १० को लागि उन्नत गणित',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly titleNp?: string;

  @ApiPropertyOptional({
    description: 'Author name in Nepali',
    example: 'डा. रमेश कुमार शर्मा',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly authorNp?: string;

  @ApiPropertyOptional({
    description: 'Publisher name in Nepali',
    example: 'एकता बुक्स नेपाल',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly publisherNp?: string;

  @ApiPropertyOptional({
    description: 'Book category in Nepali (provided by frontend)',
    example: 'पाठ्यपुस्तक',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly categoryNp?: string;

  @ApiPropertyOptional({
    description: 'Subject area in Nepali (provided by frontend)',
    example: 'गणित',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly subjectNp?: string;

  @ApiProperty({
    description: 'ISBN number',
    example: '978-99946-000-1-2',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly isbn: string;

  @ApiProperty({
    description: 'Unique book code for library system',
    example: 'BOOK-2024-001',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  readonly bookCode: string;

  @ApiProperty({
    description: 'Type/category of book',
    example: 'TEXTBOOK',
    enum: [
      'TEXTBOOK',
      'REFERENCE',
      'NOVEL',
      'ENCYCLOPEDIA',
      'MAGAZINE',
      'OTHER',
    ],
  })
  @IsNotEmpty()
  @IsEnum([
    'TEXTBOOK',
    'REFERENCE',
    'NOVEL',
    'ENCYCLOPEDIA',
    'MAGAZINE',
    'OTHER',
  ])
  readonly bookType: string;

  @ApiPropertyOptional({
    description: 'Whether book is for SEE examination reference',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  readonly isSeeReference?: boolean;

  @ApiPropertyOptional({
    description: 'Whether book is NEB prescribed reference',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  readonly isNebReference?: boolean;

  @ApiPropertyOptional({
    description: 'Curriculum level (e.g., "Grade 10", "Bachelor")',
    example: 'Grade 10',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly curriculumLevel?: string;

  @ApiPropertyOptional({
    description: 'Subject area',
    example: 'Mathematics',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly subject?: string;

  @ApiProperty({
    description: 'Date when book was acquired/purchased',
    example: '2024-01-15T00:00:00.000Z',
    type: Date,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly acquisitionDate: Date;

  @ApiProperty({
    description: 'Purchase price of the book',
    example: 450,
    type: Number,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly price: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'NPR',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly currency?: string;

  @ApiPropertyOptional({
    description: 'Total number of copies available',
    example: 10,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly totalCopies?: number;

  @ApiPropertyOptional({
    description: 'Book description or summary',
    example: 'Comprehensive mathematics textbook covering all SEE syllabus',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({
    description: 'Language of the book',
    example: 'Nepali',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly language?: string;

  @ApiPropertyOptional({
    description: 'Edition number',
    example: '5th Edition',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly edition?: string;

  @ApiPropertyOptional({
    description: 'Edition in Nepali (provided by frontend)',
    example: 'पाँचौं संस्करण',
    type: String,
  })
  @IsOptional()
  @IsString()
  readonly editionNp?: string;

  @ApiPropertyOptional({
    description: 'Total number of pages',
    example: 320,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  readonly pages?: number;
}
