/* Generates migration 018 (NP twins for every user-facing name/text field).
 * Run: npx ts-node scripts/gen-018-np-twins.ts > src/database/migrations/018_name_np_twins.sql
 * Each twin mirrors the AD column's exact type. ADD COLUMN IF NOT EXISTS.
 */
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

// [table, adColumn, npColumn]
const PAIRS: Array<[string, string, string]> = [
  // ---- people: demographic labels + names ----
  ['students', 'religion', 'religion_np'],
  ['students', 'nationality', 'nationality_np'],
  ['students', 'mother_tongue', 'mother_tongue_np'],
  ['students', 'caste_ethnicity', 'caste_ethnicity_np'],
  ['students', 'birthplace', 'birthplace_np'],
  ['students', 'disability_type', 'disability_type_np'],
  ['students', 'father_name', 'father_name_np'],
  ['students', 'mother_name', 'mother_name_np'],
  ['teachers', 'religion', 'religion_np'],
  ['teachers', 'nationality', 'nationality_np'],
  ['teachers', 'department', 'department_np'],
  ['teachers', 'designation', 'designation_np'],
  ['teachers', 'highest_qualification', 'highest_qualification_np'],
  ['teachers', 'specialization', 'specialization_np'],
  ['teachers', 'university_board', 'university_board_np'],
  ['teachers', 'marital_status', 'marital_status_np'],
  ['teachers', 'caste_ethnicity_name', 'caste_ethnicity_name_np'],
  ['teachers', 'emergency_contact_relation', 'emergency_contact_relation_np'],
  ['teachers', 'employment_type', 'employment_type_np'],
  ['guardians', 'occupation', 'occupation_np'],
  ['guardians', 'education_level', 'education_level_np'],
  ['guardians', 'relation_to_student', 'relation_to_student_np'],
  ['staff', 'first_name', 'first_name_np'],
  ['staff', 'last_name', 'last_name_np'],
  ['staff', 'middle_name_en', 'middle_name_np'],
  ['staff', 'department', 'department_np'],
  ['staff', 'designation', 'designation_np'],
  ['staff', 'employment_type', 'employment_type_np'],
  ['users', 'full_name', 'full_name_np'],
  // ---- online admissions ----
  ['online_admissions', 'caste', 'caste_np'],
  ['online_admissions', 'religion', 'religion_np'],
  ['online_admissions', 'nationality', 'nationality_np'],
  ['online_admissions', 'birth_place', 'birth_place_np'],
  ['online_admissions', 'grade_applied', 'grade_applied_np'],
  ['online_admissions', 'parent_name', 'parent_name_np'],
  ['online_admissions', 'guardian_name', 'guardian_name_np'],
  ['online_admissions', 'guardian_relation', 'guardian_relation_np'],
  ['online_admissions', 'father_name', 'father_name_np'],
  ['online_admissions', 'mother_name', 'mother_name_np'],
  ['online_admissions', 'father_occupation', 'father_occupation_np'],
  ['online_admissions', 'mother_occupation', 'mother_occupation_np'],
  ['online_admissions', 'previous_school', 'previous_school_np'],
  ['online_admissions', 'previous_class', 'previous_class_np'],
  ['online_admissions', 'previous_grade', 'previous_grade_np'],
  // ---- academic catalog ----
  ['classes', 'class_name', 'class_name_np'],
  ['sections', 'section_name', 'section_name_np'],
  ['exams', 'exam_name', 'exam_name_np'],
  ['grade_scales', 'scale_name', 'scale_name_np'],
  ['grade_scale_lines', 'remark', 'remark_np'],
  ['timetables', 'day_of_week', 'day_of_week_np'],
  ['live_classes', 'class_name', 'class_name_np'],
  ['live_classes', 'description', 'description_np'],
  ['academic_calendars', 'description', 'description_np'],
  ['assignments', 'title', 'title_np'],
  ['assignments', 'description', 'description_np'],
  ['report_cards', 'principal_remark', 'principal_remark_np'],
  ['report_cards', 'teacher_remark', 'teacher_remark_np'],
  ['marks', 'remarks', 'remarks_np'],
  ['attendance', 'remarks', 'remarks_np'],
  // ---- certificates (legal documents) ----
  ['certificates', 'certificate_type', 'certificate_type_np'],
  ['transfer_certificates', 'reason_for_leaving', 'reason_for_leaving_np'],
  ['transfer_certificates', 'remarks', 'remarks_np'],
  ['transfer_certificates', 'last_class', 'last_class_np'],
  ['transfer_certificates', 'issued_to', 'issued_to_np'],
  ['bonafide_certificates', 'purpose', 'purpose_np'],
  ['character_certificates', 'character_remarks', 'character_remarks_np'],
  ['character_certificates', 'conduct_description', 'conduct_description_np'],
  // ---- documents / notifications ----
  ['documents', 'title', 'title_np'],
  ['documents', 'description', 'description_np'],
  ['document_templates', 'name', 'name_np'],
  ['document_templates', 'template_content', 'template_content_np'],
  ['notifications', 'title', 'title_np'],
  ['notifications', 'message', 'message_np'],
  ['sms_templates', 'name', 'name_np'],
  ['sms_templates', 'template_text', 'template_text_np'],
  // ---- fee catalog ----
  ['fee_categories', 'category_name', 'category_name_np'],
  ['fee_categories', 'description', 'description_np'],
  ['discount_rules', 'name_en', 'name_np'],
  ['penalty_rules', 'name_en', 'name_np'],
  ['late_fine_rules', 'rule_name', 'rule_name_np'],
  ['scholarships', 'reason', 'reason_np'],
  ['scholarships', 'remarks', 'remarks_np'],
  ['fee_waiver_requests', 'reason', 'reason_np'],
  ['fee_waiver_requests', 'remarks', 'remarks_np'],
  ['fees', 'notes', 'notes_np'],
  ['student_balances', 'notes', 'notes_np'],
  ['student_promotions', 'remarks', 'remarks_np'],
  // ---- HR ----
  ['leave_types', 'name', 'name_np'],
  ['leave_requests', 'reason', 'reason_np'],
  ['leave_requests', 'rejection_reason', 'rejection_reason_np'],
  // ---- hostel / transport / library ----
  ['hostels', 'name', 'name_np'],
  ['hostels', 'address', 'address_np'],
  ['hostels', 'warden_name', 'warden_name_np'],
  ['hostel_rooms', 'room_type', 'room_type_np'],
  ['routes', 'route_name', 'route_name_np'],
  ['routes', 'start_point', 'start_point_np'],
  ['routes', 'end_point', 'end_point_np'],
  ['routes', 'route_description', 'route_description_np'],
  ['route_stops', 'stop_name', 'stop_name_np'],
  ['transport_routes', 'route_name', 'route_name_np'],
  ['transport_routes', 'start_point', 'start_point_np'],
  ['transport_routes', 'end_point', 'end_point_np'],
  ['vehicles', 'vehicle_name', 'vehicle_name_np'],
  ['vehicles', 'vehicle_type', 'vehicle_type_np'],
  ['books', 'publisher', 'publisher_np'],
  ['books', 'category', 'category_np'],
  ['books', 'subject', 'subject_np'],
  ['book_issues', 'remarks', 'remarks_np'],
  // ---- schools ----
  ['schools', 'name', 'name_np'],
  ['schools', 'address', 'address_np'],
  ['schools', 'ownership_type', 'ownership_type_np'],
  ['schools', 'school_type', 'school_type_np'],
  // ---- legacy dead tables (uniformity; no code readers) ----
  ['exam', 'exam_name', 'exam_name_np'],
  ['libraries', 'name', 'name_np'],
  ['libraries', 'location', 'location_np'],
  ['libraries', 'incharge_name', 'incharge_name_np'],
  ['transports', 'driver_name', 'driver_name_np'],
  ['transports', 'route_name', 'route_name_np'],
  ['transports', 'vehicle_name', 'vehicle_name_np'],
  ['transports', 'vehicle_type', 'vehicle_type_np'],
];

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5544', 10),
    user: process.env.DB_USERNAME || 'school',
    password: process.env.DB_PASSWORD || 'School@321',
    database: process.env.DB_NAME || 'sms_nepal',
  });
  const out: string[] = [];
  out.push('-- ============================================================================');
  out.push('-- Migration 018: EN+NP twins for every user-facing name / text field');
  out.push('-- ============================================================================');
  out.push('-- Rule: proper names, titles, descriptions, remarks/reasons and user-visible');
  out.push('-- labels get an NP twin mirroring the AD column type. Excluded: identifiers,');
  out.push('-- codes, contacts, secrets, URLs, system enums/statuses, session codes,');
  out.push('-- gender/blood codes, and internal ops tables (audit/sync/webhooks/logs).');
  out.push('-- Twins are nullable and additive only (ADD COLUMN IF NOT EXISTS).');
  out.push('-- Convention (frontend sends both, backend stores both, calcs on AD) applies.');
  out.push('-- ============================================================================');
  out.push('');
  let missing = 0;
  for (const [table, ad, np] of PAIRS) {
    const r = await pool.query(
      `SELECT data_type, character_maximum_length, udt_name
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
      [table, ad],
    );
    if (r.rowCount === 0) {
      console.error(`-- MISSING AD COLUMN: ${table}.${ad} (skipped)`);
      missing++;
      continue;
    }
    const c = r.rows[0];
    let type: string;
    if (c.data_type === 'character varying') {
      type = c.character_maximum_length
        ? `VARCHAR(${c.character_maximum_length})`
        : 'VARCHAR(255)';
    } else if (c.data_type === 'text') {
      type = 'TEXT';
    } else if (c.data_type === 'character') {
      type = `CHAR(${c.character_maximum_length || 1})`;
    } else {
      type = c.udt_name.toUpperCase();
    }
    out.push(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${np} ${type};`);
  }
  console.error(`-- ${PAIRS.length - missing}/${PAIRS.length} twins emitted`);
  console.log(out.join('\n'));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
