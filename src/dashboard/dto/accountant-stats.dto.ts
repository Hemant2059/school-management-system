import { ApiProperty } from '@nestjs/swagger';

export class AccountantStatsDto {
  @ApiProperty({ example: 150000 })
  todayCollection: number;

  @ApiProperty({ example: 2500000 })
  monthlyCollection: number;

  @ApiProperty({ example: 1200000 })
  totalPendingFees: number;

  @ApiProperty({ example: 850000 })
  totalPayrollPaid: number;

  @ApiProperty({ example: 50000 })
  totalPayrollPending: number;

  @ApiProperty({ example: 10 })
  recentTransactionsCount: number;
}
