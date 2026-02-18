import {
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsDate,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceRecordDto {
  @IsNotEmpty()
  @IsInt()
  readonly studentId: number;

  @IsNotEmpty()
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY'])
  readonly status: string;

  @IsOptional()
  @IsString()
  readonly remarks?: string;
}

export class BulkAttendanceDto {
  @IsNotEmpty()
  @IsInt()
  readonly classId: number;

  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @IsOptional()
  @IsInt()
  readonly sectionId?: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly attendanceDate: Date;

  @IsNotEmpty()
  @IsString()
  readonly academicYear: string;

  @IsOptional()
  @IsEnum(['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY'])
  readonly session?: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  readonly records: AttendanceRecordDto[];
}
