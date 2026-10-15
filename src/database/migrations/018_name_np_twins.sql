-- ============================================================================
-- Migration 018: EN+NP twins for every user-facing name / text field
-- ============================================================================
-- Rule: proper names, titles, descriptions, remarks/reasons and user-visible
-- labels get an NP twin mirroring the AD column type. Excluded: identifiers,
-- codes, contacts, secrets, URLs, system enums/statuses, session codes,
-- gender/blood codes, and internal ops tables (audit/sync/webhooks/logs).
-- Twins are nullable and additive only (ADD COLUMN IF NOT EXISTS).
-- Convention (frontend sends both, backend stores both, calcs on AD) applies.
-- ============================================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS religion_np VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality_np VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_tongue_np VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS caste_ethnicity_np VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS birthplace_np VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS disability_type_np VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name_np VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name_np VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS religion_np VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS nationality_np VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department_np VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS designation_np VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS highest_qualification_np VARCHAR(200);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS specialization_np VARCHAR(200);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS university_board_np VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS marital_status_np VARCHAR(20);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS caste_ethnicity_name_np VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS emergency_contact_relation_np VARCHAR(50);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employment_type_np VARCHAR(50);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS occupation_np VARCHAR(100);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS education_level_np VARCHAR(100);
ALTER TABLE guardians ADD COLUMN IF NOT EXISTS relation_to_student_np VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS first_name_np VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_name_np VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS middle_name_np VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_np VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS designation_np VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type_np VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_np VARCHAR(100);
-- (online_admissions twins removed with the table in migration 022.)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_name_np VARCHAR(50);
ALTER TABLE sections ADD COLUMN IF NOT EXISTS section_name_np VARCHAR(20);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_name_np VARCHAR(100);
ALTER TABLE grade_scales ADD COLUMN IF NOT EXISTS scale_name_np VARCHAR(150);
ALTER TABLE grade_scale_lines ADD COLUMN IF NOT EXISTS remark_np VARCHAR(100);
ALTER TABLE timetables ADD COLUMN IF NOT EXISTS day_of_week_np VARCHAR(20);
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS class_name_np VARCHAR(200);
ALTER TABLE live_classes ADD COLUMN IF NOT EXISTS description_np TEXT;
ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS description_np TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS title_np VARCHAR(200);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description_np TEXT;
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS principal_remark_np TEXT;
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS teacher_remark_np TEXT;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type_np VARCHAR(50);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS reason_for_leaving_np TEXT;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS last_class_np VARCHAR(50);
ALTER TABLE transfer_certificates ADD COLUMN IF NOT EXISTS issued_to_np VARCHAR(100);
ALTER TABLE bonafide_certificates ADD COLUMN IF NOT EXISTS purpose_np TEXT;
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS character_remarks_np TEXT;
ALTER TABLE character_certificates ADD COLUMN IF NOT EXISTS conduct_description_np TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title_np VARCHAR(200);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description_np TEXT;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS name_np VARCHAR(100);
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS template_content_np TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_np VARCHAR(200);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_np TEXT;
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS name_np VARCHAR(100);
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS template_text_np TEXT;
ALTER TABLE fee_categories ADD COLUMN IF NOT EXISTS category_name_np VARCHAR(100);
ALTER TABLE fee_categories ADD COLUMN IF NOT EXISTS description_np TEXT;
ALTER TABLE discount_rules ADD COLUMN IF NOT EXISTS name_np VARCHAR(150);
ALTER TABLE penalty_rules ADD COLUMN IF NOT EXISTS name_np VARCHAR(150);
ALTER TABLE late_fine_rules ADD COLUMN IF NOT EXISTS rule_name_np VARCHAR(150);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS reason_np TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE fee_waiver_requests ADD COLUMN IF NOT EXISTS reason_np TEXT;
ALTER TABLE fee_waiver_requests ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS notes_np TEXT;
ALTER TABLE student_balances ADD COLUMN IF NOT EXISTS notes_np TEXT;
ALTER TABLE student_promotions ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS name_np VARCHAR(100);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reason_np TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS rejection_reason_np TEXT;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS name_np VARCHAR(100);
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS address_np TEXT;
ALTER TABLE hostels ADD COLUMN IF NOT EXISTS warden_name_np VARCHAR(100);
ALTER TABLE hostel_rooms ADD COLUMN IF NOT EXISTS room_type_np VARCHAR(50);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_name_np VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_point_np VARCHAR(200);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_point_np VARCHAR(200);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS route_description_np TEXT;
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS stop_name_np VARCHAR(100);
ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS route_name_np VARCHAR(150);
ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS start_point_np VARCHAR(150);
ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS end_point_np VARCHAR(150);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_name_np VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type_np VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher_np VARCHAR(100);
ALTER TABLE books ADD COLUMN IF NOT EXISTS category_np VARCHAR(50);
ALTER TABLE books ADD COLUMN IF NOT EXISTS subject_np VARCHAR(100);
ALTER TABLE book_issues ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS name_np VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS address_np TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS ownership_type_np VARCHAR(50);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_type_np VARCHAR(50);

-- Missed free-text columns caught in review (same rule).
ALTER TABLE exams ADD COLUMN IF NOT EXISTS remarks_np TEXT;
ALTER TABLE fee_invoice_lines ADD COLUMN IF NOT EXISTS description_np VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS remarks_np TEXT;
