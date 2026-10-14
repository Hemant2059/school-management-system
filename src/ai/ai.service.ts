import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GOVT_FREE_SEAT_QUOTA_PERCENT } from '../common/constants/nepal.constants';
import { NepaliDateUtil } from '../utils/nepali-date.util';

export interface SuggestionItem {
  type: 'overdue_fee' | 'free_seat' | 'attendance' | 'compliance' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  titleNp?: string;
  description: string;
  descriptionNp?: string;
  action?: string;
  payload?: Record<string, any>;
}

export interface DashboardInsight {
  schoolId: number;
  schoolName: string;
  generatedAt: string;
  generatedAtBs: string;
  academicYear: string;
  summary: {
    totalStudents: number;
    govtFreeSeatCount: number;
    freeSeatPercentage: number;
    freeSeatCompliant: boolean;
    overdueFeeCount: number;
    overdueFeeAmount?: number;
  };
  suggestions: SuggestionItem[];
}

const HELP_FAQ = [
  {
    q: 'How do I add a student?',
    a: 'Use POST /students with schoolId, admissionNumber, names (firstNameEn, lastNameEn), dateOfBirthAd, gender, admissionDate, admissionClassId. Optional: Nepali names (firstNameNp, lastNameNp), dateOfBirthBs, caste/ethnicity code (MOEST), address (province 1-7, district, municipality, ward).',
  },
  {
    q: 'What is the free seat quota?',
    a: 'Nepal government mandates up to 10% of students can be marked as government-mandated free seats. Use isGovtMandatedFreeSeat when creating/updating a student. Check GET /api/compliance/free-seat-report/:schoolId for compliance.',
  },
  {
    q: 'How do I record attendance?',
    a: 'Use POST /attendance for a single record or POST /attendance/bulk for a class. Include studentId, classId, attendanceDate, status (PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE), academicYear. Dates are stored in both AD and BS.',
  },
  {
    q: 'How do I collect fee payments?',
    a: 'Create a student fee (POST /fee/student-fees), then record payments with POST /fee/payments. Payment methods: CASH, BANK, CHEQUE, ESEWA, KHALTI, FONEPAY, CONNECTIPS, IMEPAY. Receipts include BS date and NPR formatting.',
  },
  {
    q: 'What are DEO/MOEST reports?',
    a: 'GET /api/compliance/deo-report/:schoolId for enrollment (MOEST v3.2). GET /api/compliance/free-seat-report/:schoolId for 10% free-seat. GET /api/compliance/annual-statistics/:schoolId for annual statistics. All report dates include BS.',
  },
  {
    q: 'Board exam registration for which classes?',
    a: 'SEE/NEB board exam registration is only for classes 8, 9, 10, 11, 12. Set boardExamRegistration when creating/updating enrollment for those classes.',
  },
];

@Injectable()
export class AiService {
  constructor(private db: DatabaseService) {}

  async getSuggestions(schoolId: number): Promise<{
    schoolId: number;
    generatedAt: string;
    generatedAtBs: string;
    suggestions: SuggestionItem[];
  }> {
    const school = await this.db.queryOne<{ school_id: number }>(
      `SELECT school_id FROM schools WHERE school_id = $1`,
      [schoolId],
    );
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const suggestions: SuggestionItem[] = [];

    const [totalStudentsRes, freeSeatCountRes, schoolStudents] =
      await Promise.all([
        this.db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE' AND is_govt_mandated_free_seat = true`,
          [schoolId],
        ),
        this.db.query<{ student_id: number }>(
          `SELECT student_id FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
          [schoolId],
        ),
      ]);

    const totalStudents = parseInt(totalStudentsRes[0]?.count || '0');
    const freeSeatCount = parseInt(freeSeatCountRes[0]?.count || '0');
    const studentIds = schoolStudents.map((s) => s.student_id);

    let overdueFees: any[] = [];
    if (studentIds.length > 0) {
      const overdueFeesRes = await this.db.query<{
        total_amount: string;
        paid_amount: string;
      }>(
        `SELECT total_amount, paid_amount FROM student_fees WHERE student_id = ANY($1) AND UPPER(status) IN ('PENDING', 'PARTIAL')`,
        [studentIds],
      );
      overdueFees = overdueFeesRes;
    }

    const freeSeatPct =
      totalStudents > 0
        ? Number(((freeSeatCount / totalStudents) * 100).toFixed(2))
        : 0;
    if (freeSeatPct > GOVT_FREE_SEAT_QUOTA_PERCENT) {
      suggestions.push({
        type: 'free_seat',
        priority: 'high',
        title: 'Free seat quota exceeded',
        titleNp: 'निःशुल्क सीट कोटा भन्दा बढी',
        description: `Government free seats are ${freeSeatPct}% (max ${GOVT_FREE_SEAT_QUOTA_PERCENT}%). Review free-seat report.`,
        descriptionNp: `सरकारी निःशुल्क सीट ${freeSeatPct}% (अधिकतम ${GOVT_FREE_SEAT_QUOTA_PERCENT}%)। रिपोर्ट जाँच गर्नुहोस्।`,
        action: 'View free-seat report',
        payload: { report: 'free-seat-report' },
      });
    } else if (
      freeSeatPct < GOVT_FREE_SEAT_QUOTA_PERCENT &&
      totalStudents >= 10
    ) {
      suggestions.push({
        type: 'free_seat',
        priority: 'low',
        title: 'Free seat quota available',
        titleNp: 'निःशुल्क सीट कोटा उपलब्ध',
        description: `You can add ${Math.max(0, Math.floor((totalStudents * GOVT_FREE_SEAT_QUOTA_PERCENT) / 100) - freeSeatCount)} more government-mandated free seat(s) (${freeSeatPct}% of ${totalStudents}).`,
        action: 'View free-seat report',
        payload: { report: 'free-seat-report' },
      });
    }

    if (overdueFees.length > 0) {
      const totalOverdue = overdueFees.reduce(
        (sum, f) =>
          sum +
          Number(
            (parseFloat(f.total_amount) || 0) -
              (parseFloat(f.paid_amount) || 0),
          ),
        0,
      );
      suggestions.push({
        type: 'overdue_fee',
        priority: 'high',
        title: `${overdueFees.length} overdue fee(s)`,
        titleNp: `${overdueFees.length} भुक्तानी बाकी`,
        description: `Total overdue amount: NPR ${totalOverdue.toLocaleString()}. Send reminders or collect payments.`,
        descriptionNp: `जम्मा बाकी रकम: रु ${totalOverdue.toLocaleString()}। अनुस्मारक पठाउनुहोस् वा भुक्तानी लिनुहोस्।`,
        action: 'View overdue fees',
        payload: { count: overdueFees.length, amount: totalOverdue },
      });
    }

    suggestions.push({
      type: 'compliance',
      priority: 'medium',
      title: 'DEO reports ready',
      titleNp: 'DEO रिपोर्ट तयार',
      description:
        'Use compliance endpoints for enrollment, free-seat, and annual statistics. All dates include BS for Nepal government submission.',
      descriptionNp:
        'नामांकन, निःशुल्क सीट र वार्षिक तथ्याङ्कको लागि compliance API प्रयोग गर्नुहोस्।',
      action: 'Compliance',
      payload: { deoReport: true },
    });

    const { bsDate } = NepaliDateUtil.adToBs(new Date());

    return {
      schoolId,
      generatedAt: new Date().toISOString(),
      generatedAtBs: bsDate,
      suggestions,
    };
  }

  async getDashboardInsights(schoolId: number): Promise<DashboardInsight> {
    const school = await this.db.queryOne<{
      school_id: number;
      school_name: string;
    }>(
      `SELECT school_id, name AS school_name FROM schools WHERE school_id = $1`,
      [schoolId],
    );
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const { suggestions, generatedAt, generatedAtBs } =
      await this.getSuggestions(schoolId);

    const [totalStudentsRes, freeSeatCountRes, schoolStudents] =
      await Promise.all([
        this.db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE' AND is_govt_mandated_free_seat = true`,
          [schoolId],
        ),
        this.db.query<{ student_id: number }>(
          `SELECT student_id FROM students WHERE school_id = $1 AND is_active = true AND current_status = 'ACTIVE'`,
          [schoolId],
        ),
      ]);

    const totalStudents = parseInt(totalStudentsRes[0]?.count || '0');
    const freeSeatCount = parseInt(freeSeatCountRes[0]?.count || '0');
    const studentIds = schoolStudents.map((s) => s.student_id);

    let overdueFees: any[] = [];
    if (studentIds.length > 0) {
      const overdueFeesRes = await this.db.query<{
        total_amount: string;
        paid_amount: string;
      }>(
        `SELECT total_amount, paid_amount FROM student_fees WHERE student_id = ANY($1) AND UPPER(status) IN ('PENDING', 'PARTIAL')`,
        [studentIds],
      );
      overdueFees = overdueFeesRes;
    }

    const freeSeatPct =
      totalStudents > 0
        ? Number(((freeSeatCount / totalStudents) * 100).toFixed(2))
        : 0;

    const totalOverdue = overdueFees.reduce(
      (sum, f) =>
        sum +
        Number(
          (parseFloat(f.total_amount) || 0) - (parseFloat(f.paid_amount) || 0),
        ),
      0,
    );

    return {
      schoolId: school.school_id,
      schoolName: school.school_name,
      generatedAt,
      generatedAtBs,
      academicYear: NepaliDateUtil.getCurrentFiscalYear().yearCode,
      summary: {
        totalStudents,
        govtFreeSeatCount: freeSeatCount,
        freeSeatPercentage: freeSeatPct,
        freeSeatCompliant: freeSeatPct <= GOVT_FREE_SEAT_QUOTA_PERCENT,
        overdueFeeCount: overdueFees.length,
        overdueFeeAmount: totalOverdue,
      },
      suggestions,
    };
  }

  getHelp(query?: string): Promise<{
    query: string | null;
    answer: string;
    faq: { q: string; a: string }[];
    generatedAt: string;
    generatedAtBs: string;
  }> {
    const faq = HELP_FAQ;
    let answer: string;

    if (!query || !query.trim()) {
      answer =
        'Ask about: adding students, fee collection, attendance, DEO reports, free seat quota, or board exam registration. Here is the FAQ list.';
    } else {
      const lower = query.toLowerCase().trim();
      const match = faq.find(
        (f) =>
          f.q.toLowerCase().includes(lower) ||
          lower.includes(f.q.toLowerCase().split(' ').slice(0, 3).join(' ')),
      );
      if (match) {
        answer = match.a;
      } else {
        answer =
          'I found these related topics: ' +
          faq
            .map((f) => f.q)
            .slice(0, 4)
            .join('; ') +
          '. Try one of these or ask more specifically.';
      }
    }

    const { bsDate } = NepaliDateUtil.adToBs(new Date());

    return Promise.resolve({
      query: query?.trim() || null,
      answer,
      faq,
      generatedAt: new Date().toISOString(),
      generatedAtBs: bsDate,
    });
  }
}
