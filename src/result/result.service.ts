import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mark } from './entities/mark.entity';
import { NepaliNumberUtil } from '../utils/nepali-number.util';
import { NEB_GRADING } from '../common/constants/nepal.constants';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(Mark)
    private markRepository: Repository<Mark>,
  ) {}

  /**
   * NEB (National Examination Board) grading per Letter Grading Guideline 2078 BS.
   * D = 35–39%, NG (Not Graded) below 35%.
   */
  getNEBGrade(
    marks: number,
    fullMarks: number,
  ): { grade: string; gradePoint: number } {
    if (fullMarks <= 0) return { grade: 'NG', gradePoint: 0 };
    const percentage = (marks / fullMarks) * 100;
    const band = NEB_GRADING.find(
      (b) => percentage >= b.minPercent && percentage <= b.maxPercent,
    );
    return band
      ? { grade: band.grade, gradePoint: band.gradePoint }
      : { grade: 'NG', gradePoint: 0 };
  }

  async calculateAndSaveMarks(
    examId: number,
    studentId: number,
    schoolId: number,
    theoryMarks: number,
    practicalMarks: number,
    fullMarks: number,
  ): Promise<Mark> {
    const totalMarks = theoryMarks + practicalMarks;
    const { grade, gradePoint } = this.getNEBGrade(totalMarks, fullMarks);
    const mark = this.markRepository.create({
      examId,
      studentId,
      schoolId,
      theoryMarks,
      practicalMarks,
      totalMarks,
      grade,
      gradePoint,
      isSubmitted: true,
      isVerified: false,
    });
    return this.markRepository.save(mark);
  }

  async generateReportCard(
    studentId: number,
    schoolId: number,
    academicYear: string,
  ): Promise<any> {
    const marks = await this.markRepository.find({
      where: { studentId, schoolId, isSubmitted: true },
      order: { createdAt: 'DESC' },
    });

    const totalSubjects = marks.length;
    const totalMarksObtained = marks.reduce(
      (sum, m) => sum + (m.totalMarks || 0),
      0,
    );
    const totalFullMarks = totalSubjects * 100;
    const percentage = (totalMarksObtained / totalFullMarks) * 100;
    const { grade, gradePoint } = this.getNEBGrade(
      totalMarksObtained,
      totalFullMarks,
    );
    const isPass = grade !== 'NG' && percentage >= 35;

    return {
      studentId,
      academicYear,
      totalSubjects,
      totalMarksObtained: NepaliNumberUtil.formatNumber(
        totalMarksObtained,
        'en',
      ),
      totalFullMarks: NepaliNumberUtil.formatNumber(totalFullMarks, 'en'),
      percentage: percentage.toFixed(2),
      grade,
      gradePoint,
      isPass, // NEB: pass if not NG and ≥35% aggregate
      marks: marks.map((m) => ({
        ...m,
        theoryMarksNp: NepaliNumberUtil.toNepali(
          m.theoryMarks?.toString() || '0',
        ),
        practicalMarksNp: NepaliNumberUtil.toNepali(
          m.practicalMarks?.toString() || '0',
        ),
        totalMarksNp: NepaliNumberUtil.toNepali(
          m.totalMarks?.toString() || '0',
        ),
      })),
    };
  }

  async getStudentResults(
    studentId: number,
    schoolId: number,
  ): Promise<Mark[]> {
    return this.markRepository.find({
      where: { studentId, schoolId, isSubmitted: true, isVerified: true },
      order: { createdAt: 'DESC' },
    });
  }
}
