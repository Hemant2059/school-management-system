import { IsNotEmpty, IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateMarksDto {
  @ApiProperty({ description: 'Exam ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly examId: number;

  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @ApiProperty({ description: 'School ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @ApiProperty({ description: 'Obtained theory marks', example: 65.5 })
  @IsNotEmpty()
  @IsNumber()
  readonly theoryMarks: number;

  @ApiProperty({ description: 'Obtained practical marks', example: 22 })
  @IsNotEmpty()
  @IsNumber()
  readonly practicalMarks: number;

  @ApiProperty({
    description: 'Total full marks for the subject',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly fullMarks: number;
}
