import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty({ example: 500 })
  totalStudents: number;

  @ApiProperty({ example: 45 })
  totalTeachers: number;

  @ApiProperty({ example: 15 })
  totalStaff: number;

  @ApiProperty({ example: 20 })
  totalSections: number;

  @ApiProperty({ example: 92.5 })
  todayAttendancePercentage: number;

  @ApiProperty({ example: 240 })
  femaleStudents: number;

  @ApiProperty({ example: 260 })
  maleStudents: number;

  @ApiProperty({ example: 12 })
  activeNotices: number;
}
