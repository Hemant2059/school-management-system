-- ============================================================================
-- Migration 020: student profiles fully required
-- ============================================================================
-- Rule: every students column is NOT NULL except:
--   (a) user-required exceptions: citizenship_number,
--       citizenship_issue_district, citizenship_issue_date,
--       citizenship_issue_date_bs, nin (citizenship details + NIN);
--   (b) structural exceptions: deleted_at (soft-delete flag),
--       user_id (portal login created after admission; FK to users),
--       iemis_student_id + birth_certificate_number (UNIQUE identifiers
--       assigned by external authorities after creation; NULLs never
--       violate UNIQUE, fake values would corrupt DEO reports),
--       student_mobile (chk_student_mobile admits only real Nepali
--       mobiles or NULL — minors often have no phone, same rationale
--       as user_id).
--   (c) format/range CHECKs that only admit real-or-NULL values:
--       student_mobile (Nepali mobile regex rejects ''), so minors without
--       phones stay NULL — consistent with user_id having no portal login.
-- Part 1 backfills existing rows with honest sentinels ('' / 'NONE' and
-- per-row real values where known); Part 2 enforces NOT NULL.
-- Convention: frontend sends every field (middle names '' when none,
-- disability 'NONE' when has_disability is false).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Part 1: backfill (3 demo rows; COALESCE keeps any real values present)
-- --------------------------------------------------------------------------
UPDATE students SET
  admission_date = COALESCE(admission_date, created_at::date),
  admission_date_bs = COALESCE(admission_date_bs, '2083-06-28'),
  admission_class_id = COALESCE(admission_class_id, 1),
  middle_name_en = COALESCE(middle_name_en, ''),
  middle_name_np = COALESCE(middle_name_np, ''),
  display_name = COALESCE(display_name, TRIM(first_name_en || ' ' || COALESCE(last_name_en, ''))),
  student_code = COALESCE(student_code, 'STU-2026-001-000' || student_id),
  birthplace = COALESCE(birthplace, ''),
  birthplace_np = COALESCE(birthplace_np, ''),
  student_email = COALESCE(student_email, ''),
  mother_tongue = COALESCE(mother_tongue, 'Nepali'),
  blood_group = COALESCE(blood_group, ''),
  -- Kathmandu plausibles for demo rows (guardians are Kathmandu-based);
  -- going forward the API validates province 1-7 / ward 1-35.
  permanent_province_id = COALESCE(permanent_province_id, 1),
  permanent_district_id = COALESCE(permanent_district_id, 1),
  permanent_municipality_id = COALESCE(permanent_municipality_id, 1),
  permanent_ward_no = COALESCE(permanent_ward_no, 10),
  permanent_tole_en = COALESCE(permanent_tole_en, ''),
  permanent_tole_np = COALESCE(permanent_tole_np, ''),
  temporary_province_id = COALESCE(temporary_province_id, 0),
  temporary_district_id = COALESCE(temporary_district_id, 0),
  temporary_municipality_id = COALESCE(temporary_municipality_id, 0),
  temporary_ward_no = COALESCE(temporary_ward_no, 0),
  temporary_tole_en = COALESCE(temporary_tole_en, ''),
  temporary_address_en = COALESCE(temporary_address_en, ''),
  temporary_tole_np = COALESCE(temporary_tole_np, ''),
  temporary_address_np = COALESCE(temporary_address_np, ''),
  created_by = COALESCE(created_by, 1),
  updated_by = COALESCE(updated_by, 1),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW()),
  father_name = COALESCE(father_name, ''),
  father_phone = COALESCE(father_phone, ''),
  father_name_np = COALESCE(father_name_np, ''),
  mother_name = COALESCE(mother_name, ''),
  mother_phone = COALESCE(mother_phone, ''),
  mother_name_np = COALESCE(mother_name_np, ''),
  profile_photo_url = COALESCE(profile_photo_url, ''),
  disability_type = COALESCE(disability_type, 'NONE'),
  disability_type_np = COALESCE(disability_type_np, 'कुनै छैन'),
  current_status = COALESCE(current_status, 'ACTIVE'),
  is_active = COALESCE(is_active, true),
  roll_number = COALESCE(roll_number, 0);

-- Per-row real values (demo stewards, verified against _np twins).
UPDATE students SET mother_tongue = 'Maithili', caste_ethnicity = 'Brahmin',
  caste_code = '01A', religion_np = 'हिन्दु' WHERE admission_number = '2079-001';
UPDATE students SET mother_tongue = 'Nepali', caste_ethnicity = 'Chhetri',
  caste_code = '02B', religion_np = 'हिन्दु' WHERE admission_number = '2079-002';
UPDATE students SET mother_tongue = 'Maithili', caste_ethnicity = 'Yadav',
  caste_code = '03Y', religion_np = 'हिन्दु' WHERE admission_number = '2079-003';

-- --------------------------------------------------------------------------
-- Part 2: enforce NOT NULL (exceptions listed in header stay nullable)
-- --------------------------------------------------------------------------
ALTER TABLE students ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN student_code SET NOT NULL;
ALTER TABLE students ALTER COLUMN admission_date SET NOT NULL;
ALTER TABLE students ALTER COLUMN admission_class_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN middle_name_en SET NOT NULL;
ALTER TABLE students ALTER COLUMN last_name_en SET NOT NULL;
ALTER TABLE students ALTER COLUMN first_name_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN middle_name_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN last_name_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN gender SET NOT NULL;
ALTER TABLE students ALTER COLUMN date_of_birth_ad SET NOT NULL;
ALTER TABLE students ALTER COLUMN date_of_birth_bs SET NOT NULL;
ALTER TABLE students ALTER COLUMN birthplace SET NOT NULL;
ALTER TABLE students ALTER COLUMN nationality SET NOT NULL;
ALTER TABLE students ALTER COLUMN religion SET NOT NULL;
ALTER TABLE students ALTER COLUMN roll_number SET NOT NULL;
ALTER TABLE students ALTER COLUMN current_status SET NOT NULL;
ALTER TABLE students ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE students ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE students ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE students ALTER COLUMN student_email SET NOT NULL;
ALTER TABLE students ALTER COLUMN is_govt_mandated_free_seat SET NOT NULL;
ALTER TABLE students ALTER COLUMN is_economically_disadvantaged SET NOT NULL;
ALTER TABLE students ALTER COLUMN caste_ethnicity SET NOT NULL;
ALTER TABLE students ALTER COLUMN blood_group SET NOT NULL;
ALTER TABLE students ALTER COLUMN mother_tongue SET NOT NULL;
ALTER TABLE students ALTER COLUMN permanent_province_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN permanent_district_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN permanent_municipality_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN permanent_ward_no SET NOT NULL;
ALTER TABLE students ALTER COLUMN permanent_tole_en SET NOT NULL;
ALTER TABLE students ALTER COLUMN permanent_tole_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_province_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_district_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_municipality_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_ward_no SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_tole_en SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_address_en SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_tole_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN temporary_address_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE students ALTER COLUMN updated_by SET NOT NULL;
ALTER TABLE students ALTER COLUMN disability_type SET NOT NULL;
ALTER TABLE students ALTER COLUMN admission_date_bs SET NOT NULL;
ALTER TABLE students ALTER COLUMN caste_code SET NOT NULL;
ALTER TABLE students ALTER COLUMN father_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN father_phone SET NOT NULL;
ALTER TABLE students ALTER COLUMN mother_name SET NOT NULL;
ALTER TABLE students ALTER COLUMN mother_phone SET NOT NULL;
ALTER TABLE students ALTER COLUMN profile_photo_url SET NOT NULL;
ALTER TABLE students ALTER COLUMN nationality_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN mother_tongue_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN caste_ethnicity_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN birthplace_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN disability_type_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN father_name_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN mother_name_np SET NOT NULL;
ALTER TABLE students ALTER COLUMN religion_np SET NOT NULL;
