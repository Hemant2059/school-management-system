import { ApiProperty } from '@nestjs/swagger';

export class TeacherStatsDto {
  @ApiProperty({ example: 120 })
  totalStudents: number;

  @ApiProperty({ example: 25 })
  totalAssignmentsGiven: number;

  @ApiProperty({ example: 8 })
  pendingGrading: number;

  @ApiProperty({ example: 4 })
  todayClasses: number;

  @ApiProperty({ example: 5 })
  totalSubjects: number;

  @ApiProperty({ example: 90.5 })
  averageClassAttendance: number;
}
