import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document type', example: 'certificate' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Document title', example: 'Birth Certificate' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'File name', example: 'birth_cert.pdf' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File path', example: '/uploads/birth_cert.pdf' })
  @IsNotEmpty()
  @IsString()
  filePath: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024 })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Student ID', example: 1 })
  @IsOptional()
  @IsInt()
  studentId?: number;

  @ApiPropertyOptional({ description: 'Teacher ID', example: 1 })
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @ApiPropertyOptional({ description: 'Staff ID', example: 1 })
  @IsOptional()
  @IsInt()
  staffId?: number;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Document title in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  titleNp?: string;

  @ApiPropertyOptional({
    description:
      'Description in Nepali (provided by frontend, stored verbatim)',
  })
  @IsOptional()
  @IsString()
  descriptionNp?: string;

  @ApiPropertyOptional({ description: 'School ID', example: 1 })
  @IsOptional()
  @IsInt()
  schoolId?: number;
}
