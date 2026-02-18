import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../student/entities/student.entity';
import { School } from '../school/entities/school.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { AcademicClass } from '../academic-class/entities/academic-class.entity';
import { Section } from '../section/entities/section.entity';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { GOVT_FREE_SEAT_QUOTA_PERCENT } from '../common/constants/nepal.constants';

function addReportBsDates(report: Record<string, any>): Record<string, any> {
  const generatedAt = report.generatedAt;
  if (generatedAt) {
    try {
      report.generatedAtBs = NepaliDateUtil.adToBs(generatedAt).bsDate;
    } catch {
      // ignore
    }
  }
  return report;
}

/**
 * DEO (District Education Office) / MOEST compliance reports for Nepal.
 * Aligned with MOEST enrollment and reporting templates.
 */
@Injectable()
export class DeoReportService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(AcademicClass)
    private classRepository: Repository<AcademicClass>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  async generateEnrollmentReport(schoolId: number) {
    const school = await this.schoolRepository.findOne({
      where: { schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const students = await this.studentRepository.find({
      where: { schoolId, isActive: true, currentStatus: 'ACTIVE' },
    });
    const studentIds = students.map((s) => s.studentId);

    const enrollments =
      studentIds.length > 0
        ? await this.enrollmentRepository.find({
            where: {
              studentId: In(studentIds),
              isCurrent: true,
              status: 'ACTIVE',
            },
          })
        : [];

    const classIds = [...new Set(enrollments.map((e) => e.classId))];
    const sectionIds = [
      ...new Set(enrollments.map((e) => e.sectionId).filter(Boolean)),
    ];

    const classes =
      classIds.length > 0
        ? await this.classRepository.find({ where: { classId: In(classIds) } })
        : [];
    const sections =
      sectionIds.length > 0
        ? await this.sectionRepository.find({
            where: { sectionId: In(sectionIds) },
          })
        : [];

    const classMap = new Map(classes.map((c) => [c.classId, c]));
    const sectionMap = new Map(sections.map((s) => [s.sectionId, s]));
    const enrollmentByStudent = new Map(
      enrollments.map((e) => [e.studentId, e]),
    );

    const out = {
      reportType: 'DEO_ENROLLMENT_V3_2',
      generatedAt: new Date().toISOString(),
      school: {
        schoolId: school.schoolId,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        schoolNameNepali: school.schoolNameNepali ?? undefined,
        provinceId: school.provinceId ?? undefined,
        districtId: school.districtId ?? undefined,
        registrationNumber: school.registrationNumber ?? undefined,
        affiliationNumber: school.affiliationNumber ?? undefined,
      },
      academicYear: this.getCurrentAcademicYearBs(),
      data: students.map((s) => {
        const enrollment = enrollmentByStudent.get(s.studentId);
        const ac = enrollment ? classMap.get(enrollment.classId) : undefined;
        const sec = enrollment?.sectionId
          ? sectionMap.get(enrollment.sectionId)
          : undefined;
        return {
          studentId: s.studentId,
          admissionNumber: s.admissionNumber,
          rollNumber: enrollment?.rollNumber ?? s.rollNumber,
          name: s.getFullName(),
          nameNp: s.getFullName('np'),
          casteCode: s.casteEthnicityCode || null,
          gender: s.gender,
          isGovtSeat: s.isGovtMandatedFreeSeat ?? false,
          dobBs: s.dobBsSnapshot || s.dateOfBirthBs,
          className: ac?.className ?? null,
          sectionName: sec?.sectionName ?? null,
          academicYear: enrollment?.academicYear ?? null,
          boardExamRegistration: enrollment?.boardExamRegistration ?? null,
        };
      }),
    };
    return addReportBsDates(out);
  }

  private getCurrentAcademicYearBs(): string {
    const { yearCode } = NepaliDateUtil.getCurrentFiscalYear();
    return yearCode;
  }

  /**
   * Government-mandated 10% free-seat report per school (Nepal policy).
   * Returns count, percentage, and compliance (within 10%).
   */
  async getFreeSeatReport(schoolId: number) {
    const school = await this.schoolRepository.findOne({
      where: { schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const [total, freeSeatCount] = await Promise.all([
      this.studentRepository.count({
        where: { schoolId, isActive: true, currentStatus: 'ACTIVE' },
      }),
      this.studentRepository.count({
        where: {
          schoolId,
          isActive: true,
          currentStatus: 'ACTIVE',
          isGovtMandatedFreeSeat: true,
        },
      }),
    ]);

    const percentage =
      total > 0 ? Number(((freeSeatCount / total) * 100).toFixed(2)) : 0;
    const quotaPercent = GOVT_FREE_SEAT_QUOTA_PERCENT;
    const isCompliant = percentage <= quotaPercent;
    const maxAllowed = Math.floor((total * quotaPercent) / 100);
    const slotsRemaining = Math.max(0, maxAllowed - freeSeatCount);

    return addReportBsDates({
      reportType: 'GOVT_FREE_SEAT_QUOTA',
      schoolId,
      schoolCode: school.schoolCode,
      schoolName: school.schoolName,
      generatedAt: new Date().toISOString(),
      totalActiveStudents: total,
      govtFreeSeatCount: freeSeatCount,
      percentage,
      quotaPercent,
      isCompliant,
      maxAllowedFreeSeats: maxAllowed,
      slotsRemainingForFreeSeat: slotsRemaining,
    });
  }

  /**
   * Annual statistics report for DEO/MOEST (Nepal government compliance).
   * Summary by class, gender, free-seat count, and current academic year.
   */
  async getAnnualStatisticsReport(schoolId: number) {
    const school = await this.schoolRepository.findOne({
      where: { schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const students = await this.studentRepository.find({
      where: { schoolId, isActive: true, currentStatus: 'ACTIVE' },
    });
    const enrollments =
      students.length > 0
        ? await this.enrollmentRepository.find({
            where: {
              studentId: In(students.map((s) => s.studentId)),
              isCurrent: true,
              status: 'ACTIVE',
            },
          })
        : [];

    const byClass = new Map<number, number>();
    let male = 0,
      female = 0,
      other = 0,
      freeSeat = 0;
    for (const s of students) {
      if (s.gender === 'MALE') male++;
      else if (s.gender === 'FEMALE') female++;
      else other++;
      if (s.isGovtMandatedFreeSeat) freeSeat++;
    }
    for (const e of enrollments) {
      byClass.set(e.classId, (byClass.get(e.classId) ?? 0) + 1);
    }

    const academicYear = this.getCurrentAcademicYearBs();
    const generatedAt = new Date().toISOString();

    return addReportBsDates({
      reportType: 'ANNUAL_STATISTICS_DEO',
      schoolId,
      schoolCode: school.schoolCode,
      schoolName: school.schoolName,
      generatedAt,
      academicYear,
      totalStudents: students.length,
      byGender: { male, female, other },
      govtFreeSeatCount: freeSeat,
      freeSeatPercentage:
        students.length > 0
          ? Number(((freeSeat / students.length) * 100).toFixed(2))
          : 0,
      byClass: Object.fromEntries(byClass),
      complianceNote: 'For DEO/MOEST annual submission (Nepal)',
    });
  }
}
