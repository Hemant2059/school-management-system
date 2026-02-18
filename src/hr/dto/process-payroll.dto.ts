import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class ProcessPayrollDto {
  @IsNotEmpty()
  @IsInt()
  readonly staffId: number;

  @IsNotEmpty()
  @IsInt()
  readonly schoolId: number;

  @IsNotEmpty()
  @IsString()
  readonly salaryMonthBs: string; // Format: "2082-01"

  @IsNotEmpty()
  @IsNumber()
  readonly basicSalary: number;

  @IsOptional()
  @IsNumber()
  readonly houseRentAllowance?: number;

  @IsOptional()
  @IsNumber()
  readonly transportAllowance?: number;

  @IsOptional()
  @IsNumber()
  readonly medicalAllowance?: number;

  // ✅ ADDED: Missing properties
  @IsOptional()
  @IsNumber()
  readonly otherAllowances?: number;

  @IsOptional()
  @IsNumber()
  readonly citDeduction?: number;

  @IsOptional()
  @IsNumber()
  readonly providentFund?: number;

  // ✅ ADDED: Missing property
  @IsOptional()
  @IsNumber()
  readonly otherDeductions?: number;

  @IsOptional()
  @IsString()
  readonly panNumber?: string;

  @IsOptional()
  readonly isTaxExempt?: boolean;
}
