import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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

@Injectable()
export class DeoReportService {
  constructor(private db: DatabaseService) {}

  private getCurrentAcademicYearBs(): string {
    const { yearCode } = NepaliDateUtil.getCurrentFiscalYear();
    return yearCode;
  }

  async generateEnrollmentReport(schoolId: number) {
    const school = await this.db.queryOne<{
      school_id: number;
      school_code: string;
      school_name: string;
      school_name_nepali: string | null;
      province_id: number | null;
      district_id: number | null;
      registration_number: string | null;
      affiliation_number: string | null;
    }>(`SELECT * FROM schools WHERE school_id = $1`, [schoolId]);

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const students = await this.db.query<{
      student_id: number;
      admission_number: string;
      roll_number: number | null;
      first_name_en: string;
      middle_name_en: string | null;
      last_name_en: string;
      first_name_np: string | null;
      middle_name_np: string | null;
      last_name_np: string | null;
      caste_code: string | null;
      caste_ethnicity: string | null;
      gender: string;
      is_govt_mandated_free_seat: boolean;
      date_of_birth_bs: string | null;
    }>(
      `SELECT * FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
      [schoolId],
    );

    const studentIds = students.map((s) => s.student_id);

    let student_enrollments: any[] = [];
    if (studentIds.length > 0) {
      // Canonical placement: enrollments keyed to the current session.
      student_enrollments = await this.db.query<{
        student_id: number;
        class_id: number;
        section_id: number | null;
        roll_number: number | null;
        status: string;
        academic_year: string | null;
      }>(
        `SELECT en.student_id, en.class_id, en.section_id,
                en.roll_no AS roll_number, ay.session_name AS academic_year
           FROM enrollments en
           JOIN academic_years ay ON ay.academic_year_id = en.academic_year_id
          WHERE en.student_id = ANY($1) AND ay.is_current = true AND en.status <> 'LEFT'`,
        [studentIds],
      );
    }

    const classIds = [...new Set(student_enrollments.map((e) => e.class_id))];
    const sectionIds = [
      ...new Set(student_enrollments.map((e) => e.section_id).filter(Boolean)),
    ];

    let classes: any[] = [];
    let sections: any[] = [];
    if (classIds.length > 0) {
      classes = await this.db.query<{ class_id: number; class_name: string }>(
        `SELECT class_id, class_name FROM classes WHERE class_id = ANY($1)`,
        [classIds],
      );
    }
    if (sectionIds.length > 0) {
      sections = await this.db.query<{
        section_id: number;
        section_name: string;
      }>(
        `SELECT section_id, section_name FROM sections WHERE section_id = ANY($1)`,
        [sectionIds],
      );
    }

    const classMap = new Map(classes.map((c) => [c.class_id, c]));
    const sectionMap = new Map(sections.map((s) => [s.section_id, s]));
    const enrollmentByStudent = new Map(
      student_enrollments.map((e) => [e.student_id, e]),
    );

    const getFullName = (s: any, lang: 'en' | 'np') => {
      if (lang === 'np' && s.first_name_np) {
        return `${s.first_name_np} ${s.middle_name_np || ''} ${s.last_name_np || ''}`.trim();
      }
      return `${s.first_name_en} ${s.middle_name_en || ''} ${s.last_name_en || ''}`.trim();
    };

    const out = {
      reportType: 'DEO_ENROLLMENT_V3_2',
      generatedAt: new Date().toISOString(),
      school: {
        schoolId: school.school_id,
        schoolCode: school.school_code,
        schoolName: school.school_name,
        schoolNameNepali: school.school_name_nepali || undefined,
        provinceId: school.province_id || undefined,
        districtId: school.district_id || undefined,
        registrationNumber: school.registration_number || undefined,
        affiliationNumber: school.affiliation_number || undefined,
      },
      academicYear: this.getCurrentAcademicYearBs(),
      data: students.map((s) => {
        const enrollment = enrollmentByStudent.get(s.student_id);
        const ac = enrollment ? classMap.get(enrollment.class_id) : undefined;
        const sec = enrollment?.section_id
          ? sectionMap.get(enrollment.section_id)
          : undefined;
        return {
          studentId: s.student_id,
          admissionNumber: s.admission_number,
          rollNumber: enrollment?.roll_number ?? s.roll_number,
          name: getFullName(s, 'en'),
          nameNp: getFullName(s, 'np'),
          casteCode: s.caste_code ?? s.caste_ethnicity ?? null,
          gender: s.gender,
          isGovtSeat: s.is_govt_mandated_free_seat ?? false,
          dobBs: s.date_of_birth_bs,
          className: ac?.class_name ?? null,
          sectionName: sec?.section_name ?? null,
          academicYear: enrollment?.academic_year ?? null,
          boardExamRegistration: enrollment?.board_exam_registration ?? null,
        };
      }),
    };
    return addReportBsDates(out);
  }

  async getFreeSeatReport(schoolId: number) {
    const school = await this.db.queryOne<{
      school_id: number;
      school_code: string;
      school_name: string;
    }>(
      `SELECT school_id, school_id AS school_code, name AS school_name FROM schools WHERE school_id = $1`,
      [schoolId],
    );
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const [totalRes, freeSeatCountRes] = await Promise.all([
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
        [schoolId],
      ),
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE' AND is_govt_mandated_free_seat = true`,
        [schoolId],
      ),
    ]);

    const total = parseInt(totalRes[0]?.count || '0');
    const freeSeatCount = parseInt(freeSeatCountRes[0]?.count || '0');

    const percentage =
      total > 0 ? Number(((freeSeatCount / total) * 100).toFixed(2)) : 0;
    const quotaPercent = GOVT_FREE_SEAT_QUOTA_PERCENT;
    const isCompliant = percentage <= quotaPercent;
    const maxAllowed = Math.floor((total * quotaPercent) / 100);
    const slotsRemaining = Math.max(0, maxAllowed - freeSeatCount);

    return addReportBsDates({
      reportType: 'GOVT_FREE_SEAT_QUOTA',
      schoolId,
      schoolCode: school.school_code,
      schoolName: school.school_name,
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

  async getAnnualStatisticsReport(schoolId: number) {
    const school = await this.db.queryOne<{
      school_id: number;
      school_code: string;
      school_name: string;
    }>(
      `SELECT school_id, school_id AS school_code, name AS school_name FROM schools WHERE school_id = $1`,
      [schoolId],
    );
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const students = await this.db.query<{
      student_id: number;
      gender: string;
      is_govt_mandated_free_seat: boolean;
    }>(
      `SELECT student_id, gender, is_govt_mandated_free_seat FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
      [schoolId],
    );

    const studentIds = students.map((s) => s.student_id);

    let student_enrollments: any[] = [];
    if (studentIds.length > 0) {
      student_enrollments = await this.db.query<{
        student_id: number;
        class_id: number;
      }>(
        `SELECT student_id, class_id FROM student_enrollments WHERE student_id = ANY($1) AND is_current = true AND status = 'ACTIVE'`,
        [studentIds],
      );
    }

    const byClass = new Map<number, number>();
    let male = 0,
      female = 0,
      other = 0,
      freeSeat = 0;
    for (const s of students) {
      if (s.gender === 'MALE') male++;
      else if (s.gender === 'FEMALE') female++;
      else other++;
      if (s.is_govt_mandated_free_seat) freeSeat++;
    }
    for (const e of student_enrollments) {
      byClass.set(e.class_id, (byClass.get(e.class_id) ?? 0) + 1);
    }

    const academicYear = this.getCurrentAcademicYearBs();
    const generatedAt = new Date().toISOString();

    return addReportBsDates({
      reportType: 'ANNUAL_STATISTICS_DEO',
      schoolId,
      schoolCode: school.school_code,
      schoolName: school.school_name,
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
