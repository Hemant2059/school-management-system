/* Backfills every <date>_bs twin from its AD counterpart.
 * Run: npx ts-node scripts/backfill-bs-dates.ts
 * Only touches rows where AD is set and BS is NULL. Idempotent.
 */
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { NepaliDateUtil } from '../src/utils/nepali-date.util';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5544', 10),
  user: process.env.DB_USERNAME || 'school',
  password: process.env.DB_PASSWORD || 'School@321',
  database: process.env.DB_NAME || 'sms_nepal',
});

// [table, adColumn, bsColumn, isTimestamp]
const PAIRS: Array<[string, string, string, boolean?]> = [
  ['academic_calendars', 'start_date', 'start_date_bs'],
  ['academic_calendars', 'end_date', 'end_date_bs'],
  ['academic_years', 'start_date_ad', 'start_date_bs'],
  ['academic_years', 'end_date_ad', 'end_date_bs'],
  ['assignments', 'due_date', 'due_date_bs'],
  ['attendance', 'attendance_date', 'attendance_date_bs'],
  ['attendance_records', 'date', 'date_bs'],
  ['bonafide_certificates', 'issue_date', 'issue_date_bs'],
  ['book_issues', 'issue_date', 'issue_date_bs'],
  ['book_issues', 'due_date', 'due_date_bs'],
  ['book_issues', 'return_date', 'return_date_bs'],
  ['books', 'acquisition_date', 'acquisition_date_bs'],
  ['certificates', 'issued_date', 'issued_date_bs'],
  ['character_certificates', 'issue_date', 'issue_date_bs'],
  ['discount_rules', 'valid_from_ad', 'valid_from_bs'],
  ['discount_rules', 'valid_to_ad', 'valid_to_bs'],
  ['enrollments', 'enrolled_on_ad', 'enrolled_on_bs'],
  ['exam', 'start_date', 'start_date_bs'],
  ['exam', 'end_date', 'end_date_bs'],
  ['exam_schedules', 'exam_date_ad', 'exam_date_bs'],
  ['exams', 'exam_date', 'exam_date_bs'],
  ['exams', 'start_date', 'start_date_bs'],
  ['exams', 'end_date', 'end_date_bs'],
  ['fee_invoices', 'invoice_date_ad', 'invoice_date_bs'],
  ['fee_invoices', 'due_date_ad', 'due_date_bs'],
  ['fee_structures', 'due_date', 'due_date_bs'],
  ['fee_installments', 'due_date', 'due_date_bs'],
  ['fee_transactions', 'payment_date', 'payment_date_bs'],
  ['fees', 'due_date', 'due_date_bs'],
  ['fiscal_years', 'start_ad', 'start_bs'],
  ['fiscal_years', 'end_ad', 'end_bs'],
  ['guardians', 'citizenship_issue_date', 'citizenship_issue_date_bs'],
  ['hostel_allocations', 'allocated_on_ad', 'allocated_on_bs'],
  ['hostel_students', 'check_in_date', 'check_in_date_bs'],
  ['hostel_students', 'check_out_date', 'check_out_date_bs'],
  ['late_fine_rules', 'applicable_from', 'applicable_from_bs'],
  ['leave_requests', 'start_date', 'start_date_bs'],
  ['leave_requests', 'end_date', 'end_date_bs'],
  ['live_classes', 'scheduled_at', 'scheduled_at_bs', true],
  ['payments', 'payment_date', 'payment_date_bs'],
  ['payments', 'cheque_date', 'cheque_date_bs'],
  ['payroll', 'payment_date', 'payment_date_bs'],
  ['payrolls', 'payment_date', 'payment_date_bs'],
  ['schools', 'established_date', 'established_date_bs'],
  ['staff', 'date_of_birth', 'date_of_birth_bs'],
  ['staff', 'joining_date', 'joining_date_bs'],
  ['student_enrollments', 'enrollment_date', 'enrollment_date_bs'],
  ['student_promotions', 'promotion_date', 'promotion_date_bs'],
  ['student_scholarships', 'valid_from_ad', 'valid_from_bs'],
  ['student_scholarships', 'valid_to_ad', 'valid_to_bs'],
  ['students', 'admission_date', 'admission_date_bs'],
  ['students', 'date_of_birth_ad', 'date_of_birth_bs'],
  ['students', 'citizenship_issue_date', 'citizenship_issue_date_bs'],
  ['teachers', 'date_of_birth', 'date_of_birth_bs'],
  ['teachers', 'joining_date', 'joining_date_bs'],
  ['teachers', 'citizenship_issue_date', 'citizenship_issue_date_bs'],
  ['teachers', 'license_expiry_date', 'license_expiry_date_bs'],
  ['terms', 'start_date_ad', 'start_date_bs'],
  ['terms', 'end_date_ad', 'end_date_bs'],
  ['transfer_certificates', 'issue_date', 'issue_date_bs'],
  ['transfer_certificates', 'joining_date', 'joining_date_bs'],
  ['transfer_certificates', 'leaving_date', 'leaving_date_bs'],
  ['transport_assignments', 'assignment_date', 'assignment_date_bs'],
  ['transport_assignments', 'effective_from', 'effective_from_bs'],
  ['transport_assignments', 'effective_to', 'effective_to_bs'],
  ['vehicles', 'insurance_expiry', 'insurance_expiry_bs'],
  ['vehicles', 'permit_expiry', 'permit_expiry_bs'],
];

function toBs(ad: any): string | null {
  if (!ad) return null;
  try {
    const d = ad instanceof Date ? ad : new Date(ad);
    if (isNaN(d.getTime())) return null;
    return NepaliDateUtil.adToBs(d).bsDate;
  } catch {
    return null;
  }
}

async function main() {
  let total = 0;
  for (const [table, adCol, bsCol, isTs] of PAIRS) {
    try {
      // skip pairs whose BS column does not exist yet (migration not applied)
      const col = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
        [table, bsCol],
      );
      if (col.rowCount === 0) {
        console.log(`SKIP ${table}.${bsCol} (column missing)`);
        continue;
      }
      const expr = isTs ? `(${adCol})::date` : adCol;
      const rows = await pool.query(
        `SELECT ctid, ${expr} AS ad FROM ${table} WHERE ${adCol} IS NOT NULL AND ${bsCol} IS NULL LIMIT 5000`,
      );
      let n = 0;
      for (const r of rows.rows) {
        const bs = toBs(r.ad);
        if (!bs) continue;
        await pool.query(`UPDATE ${table} SET ${bsCol}=$1 WHERE ctid=$2`, [bs, r.ctid]);
        n++;
      }
      if (n > 0) console.log(`OK   ${table}.${bsCol}: ${n} rows`);
      total += n;
    } catch (e: any) {
      console.error(`FAIL ${table}.${bsCol}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`Done. ${total} cells backfilled.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
