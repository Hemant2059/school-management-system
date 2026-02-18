import { ApiProperty } from '@nestjs/swagger';

export class StudentStatsDto {
  @ApiProperty({ example: 95.0 })
  attendancePercentage: number;

  @ApiProperty({ example: 15 })
  totalAssignments: number;

  @ApiProperty({ example: 3 })
  pendingAssignments: number;

  @ApiProperty({ example: 50000 })
  totalFees: number;

  @ApiProperty({ example: 45000 })
  paidFees: number;

  @ApiProperty({ example: 5000 })
  pendingFees: number;

  @ApiProperty({ example: 'A' })
  recentGpa: string;

  @ApiProperty({ example: 3 })
  upcomingExams: number;
}
