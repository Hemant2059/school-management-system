import { IsNotEmpty, IsInt, IsOptional, IsNumber } from 'class-validator';

export class ReturnBookDto {
  @IsNotEmpty()
  @IsInt()
  readonly issueId: number;

  @IsOptional()
  @IsNumber()
  readonly fineAmount?: number;

  @IsOptional()
  readonly daysOverdue?: number;
}
