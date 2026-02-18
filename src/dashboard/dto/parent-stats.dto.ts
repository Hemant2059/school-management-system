import { ApiProperty } from '@nestjs/swagger';
import { StudentStatsDto } from './student-stats.dto';

export class ChildStatsDto {
  @ApiProperty({ example: 1 })
  studentId: number;

  @ApiProperty({ example: 'John Doe' })
  studentName: string;

  @ApiProperty({ type: StudentStatsDto })
  stats: StudentStatsDto;
}

export class ParentStatsDto {
  @ApiProperty({ type: [ChildStatsDto] })
  childrenStats: ChildStatsDto[];
}
