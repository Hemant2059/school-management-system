/**
 * Nepal-specific constants for school management system compliance.
 * Aligned with MOEST, NEB, and Government of Nepal practices.
 */

/** Nepal has 7 provinces (2015 constitution) */
export const NEPAL_PROVINCE_IDS = [1, 2, 3, 4, 5, 6, 7] as const;
export type NepalProvinceId = (typeof NEPAL_PROVINCE_IDS)[number];

/** Province names (English) for validation/display */
export const NEPAL_PROVINCES_EN: Record<number, string> = {
  1: 'Koshi',
  2: 'Madhesh',
  3: 'Bagmati',
  4: 'Gandaki',
  5: 'Lumbini',
  6: 'Karnali',
  7: 'Sudurpashchim',
};

/** NEB (National Examination Board) grading – Letter Grading Guideline 2078 BS */
export const NEB_GRADING = [
  {
    minPercent: 90,
    maxPercent: 100,
    grade: 'A+',
    gradePoint: 4.0,
    remark: 'Outstanding',
  },
  {
    minPercent: 80,
    maxPercent: 89,
    grade: 'A',
    gradePoint: 3.6,
    remark: 'Excellent',
  },
  {
    minPercent: 70,
    maxPercent: 79,
    grade: 'B+',
    gradePoint: 3.2,
    remark: 'Very Good',
  },
  {
    minPercent: 60,
    maxPercent: 69,
    grade: 'B',
    gradePoint: 2.8,
    remark: 'Good',
  },
  {
    minPercent: 50,
    maxPercent: 59,
    grade: 'C+',
    gradePoint: 2.4,
    remark: 'Satisfactory',
  },
  {
    minPercent: 40,
    maxPercent: 49,
    grade: 'C',
    gradePoint: 2.0,
    remark: 'Acceptable',
  },
  {
    minPercent: 35,
    maxPercent: 39,
    grade: 'D',
    gradePoint: 1.6,
    remark: 'Basic',
  },
  {
    minPercent: 0,
    maxPercent: 34,
    grade: 'NG',
    gradePoint: 0,
    remark: 'Not Graded',
  },
] as const;

/** Passing threshold: theory ≥35%, internal (practical) ≥40% per NEB */
export const NEB_PASS_THEORY_PERCENT = 35;
export const NEB_PASS_INTERNAL_PERCENT = 40;

/** Default currency and timezone for Nepal schools */
export const NEPAL_DEFAULT_CURRENCY = 'NPR';
export const NEPAL_DEFAULT_TIMEZONE = 'Asia/Kathmandu';

/** Academic year in Nepal: typically Shrawan (≈July) or Baisakh (April) start */
export const NEPAL_ACADEMIC_YEAR_START_MONTH_AD = 4; // Baisakh ≈ April

/** Supported payment methods (Nepal) */
export const NEPAL_PAYMENT_METHODS = [
  'CASH',
  'BANK',
  'CHEQUE',
  'ESEWA',
  'KHALTI',
  'FONEPAY',
  'CONNECTIPS',
  'IMEPAY',
  'OTHER',
] as const;

/** Nepali mobile prefix (10 digits: 98xx, 97xx, 96xx) */
export const NEPAL_MOBILE_REGEX = /^(98|97|96)\d{8}$/;

/** MOEST caste/ethnicity code pattern (01A–15Z) */
export const MOEST_CASTE_CODE_REGEX = /^(0[1-9]|1[0-5])[A-Z]$/;

/**
 * SEE/NEB board exam registration: alphanumeric, 5–20 chars.
 * (NEB/SEE symbol numbers are typically numeric; allow alphanumeric for flexibility.)
 */
export const NEB_SEE_REGISTRATION_REGEX = /^[A-Za-z0-9-]{5,20}$/;

/**
 * Class levels for which board exam registration applies (Nepal).
 * - Classes 8–10: SEE (Secondary Education Examination) preparation / registration
 * - Classes 11–12: NEB +2 (Higher Secondary) board exam
 * boardExamRegistration should only be set for these class orders.
 */
export const BOARD_EXAM_APPLICABLE_CLASS_ORDERS = [8, 9, 10, 11, 12] as const;

/** Government-mandated free seat quota (10% per school/class as per Nepal policy) */
export const GOVT_FREE_SEAT_QUOTA_PERCENT = 10;
