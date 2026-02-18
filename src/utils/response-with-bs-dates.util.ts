import { NepaliDateUtil } from './nepali-date.util';

/**
 * Date keys that commonly appear in API responses and should get a BS (Bikram Sambat) counterpart.
 * Map: AD date property name -> BS property name (default: same name + 'Bs' or '_bs' suffix).
 */
const DEFAULT_DATE_KEYS = [
  'establishedDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'dateOfBirthAd',
  'admissionDate',
  'tcIssueDate',
  'enrollmentDate',
  'dueDate',
  'paymentDate',
  'attendanceDate',
  'transactionDate',
  'transaction_date',
  'examDate',
  'joiningDate',
  'licenseExpiryDate',
  'enrollment_date',
  'due_date',
  'payment_date',
  'attendance_date',
  'generatedAt',
  'startDate',
  'endDate',
] as const;

function toBsKey(adKey: string): string {
  if (adKey.endsWith('_at')) return adKey.replace(/_at$/, '_at_bs');
  if (adKey.endsWith('Date')) return adKey.replace(/Date$/, 'DateBs');
  return `${adKey}Bs`;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Adds BS (Bikram Sambat) date fields for each AD date field in an object.
 * Used for Nepal government compliance so APIs return important dates in both AD and BS.
 */
export function withBsDates<T extends Record<string, any>>(
  obj: T,
  dateKeys: string[] = [...DEFAULT_DATE_KEYS],
): T & Record<string, string> {
  if (!obj || typeof obj !== 'object') return obj as T & Record<string, string>;
  const out: Record<string, any> = { ...obj };
  for (const key of dateKeys) {
    if (!(key in obj)) continue;
    const val = obj[key];
    const date = parseDate(val);
    if (date) {
      try {
        out[toBsKey(key)] = NepaliDateUtil.adToBs(date).bsDate;
      } catch {
        // skip if conversion fails
      }
    }
  }
  return out as T & Record<string, string>;
}

/**
 * Applies withBsDates to each item in an array.
 */
export function withBsDatesArray<T extends Record<string, any>>(
  arr: T[],
  dateKeys: string[] = [...DEFAULT_DATE_KEYS],
): (T & Record<string, string>)[] {
  if (!Array.isArray(arr)) return arr as (T & Record<string, string>)[];
  return arr.map((item) => withBsDates(item, dateKeys));
}
