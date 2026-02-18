// ============================================================================
// NEPAL SCHOOL MANAGEMENT SYSTEM - DATABASE INTERFACES
// TypeScript interfaces matching the PostgreSQL database schema
// ============================================================================

// ============================================================================
// CORE & SYSTEM
// ============================================================================

export interface School {
  school_id: number;
  school_code: string;
  school_name: string;
  school_name_nepali: string | null;
  school_type: string;
  ownership_type: string;
  established_date: Date | null;
  established_date_bs: string | null;
  registration_number: string | null;
  affiliation_number: string | null;
  moest_school_code: string | null;
  pan_number: string | null;
  ssf_employer_number: string | null;
  labor_office_registration: string | null;
  province_id: number | null;
  district_id: number | null;
  municipality_id: number | null;
  ward_no: number | null;
  ward_id: number | null;
  tole: string | null;
  tole_nepali: string | null;
  local_body_type: string | null;
  street_address: string | null;
  street_address_nepali: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  academic_year_start_month: number;
  currency_code: string;
  timezone: string;
  language_preference: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
}

export interface User {
  user_id: number;
  school_id: number;
  role_id: number | null;
  username: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  full_name: string | null;
  user_type: string;
  is_verified: boolean;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  last_login_agent: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Role {
  role_id: number;
  role_name: string;
  role_name_np: string | null;
  description: string | null;
  permissions: any;
  is_system_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AcademicYear {
  academic_year_id: number;
  school_id: number;
  session_name: string;
  session_name_np: string | null;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Shift {
  shift_id: number;
  school_id: number;
  shift_name: string;
  shift_name_np: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SystemSetting {
  setting_id: number;
  school_id: number | null;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ACADEMIC STRUCTURE
// ============================================================================

export interface AcademicClass {
  class_id: number;
  school_id: number;
  class_name: string;
  class_code: string;
  class_order: number;
  education_level: string;
  min_age: number | null;
  max_age: number | null;
  section_count: number;
  student_count: number;
  max_students_per_section: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Stream {
  stream_id: number;
  school_id: number;
  class_id: number;
  stream_name: string;
  stream_name_np: string | null;
  stream_code: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Section {
  section_id: number;
  school_id: number;
  class_id: number;
  section_name: string;
  section_code: string;
  section_order: number;
  capacity: number | null;
  student_count: number;
  homeroom_teacher_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Subject {
  subject_id: number;
  school_id: number;
  subject_name: string;
  subject_name_nepali: string | null;
  subject_code: string;
  subject_type: string;
  subject_group: string | null;
  credit_hours: number;
  is_theory: boolean;
  is_practical: boolean;
  theory_full_marks: number | null;
  theory_pass_marks: number | null;
  practical_full_marks: number | null;
  practical_pass_marks: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SubjectAllocation {
  allocation_id: number;
  school_id: number;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number | null;
  academic_year: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// STUDENTS
// ============================================================================

export interface Student {
  student_id: number;
  school_id: number;
  student_code: string;
  admission_number: string;
  roll_number: string | null;
  bus_stop_id: number | null;
  hostel_room_id: number | null;
  medical_condition: string | null;
  medications: string | null;
  allergies: string | null;
  tags: any;
  registration_number: string | null;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  display_name: string | null;
  date_of_birth_ad: Date;
  date_of_birth_bs: string | null;
  dob_bs_snapshot: string | null;
  gender: string;
  blood_group: string | null;
  religion: string | null;
  mother_tongue: string | null;
  caste_ethnicity: string | null;
  caste_ethnicity_code: string | null;
  citizenship_number: string | null;
  birth_certificate_number: string | null;
  birth_certificate_issued_by: string | null;
  birth_certificate_issue_date: Date | null;
  is_govt_mandated_free_seat: boolean;
  is_economically_disadvantaged: boolean;
  has_disability: boolean;
  disability_type: string | null;
  permanent_province_id: number | null;
  permanent_district_id: number | null;
  permanent_municipality_id: number | null;
  permanent_ward_no: number | null;
  permanent_tole_en: string | null;
  permanent_address_en: string | null;
  permanent_tole_np: string | null;
  permanent_address_np: string | null;
  temporary_province_id: number | null;
  temporary_district_id: number | null;
  temporary_municipality_id: number | null;
  temporary_ward_no: number | null;
  temporary_tole_en: string | null;
  temporary_address_en: string | null;
  temporary_tole_np: string | null;
  temporary_address_np: string | null;
  student_mobile: string | null;
  student_email: string | null;
  admission_date: Date;
  admission_class_id: number;
  previous_school_name: string | null;
  previous_school_address: string | null;
  transfer_certificate_number: string | null;
  tc_issue_date: Date | null;
  current_status: string;
  is_active: boolean;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  profile_photo_url: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
}

export interface StudentEnrollment {
  enrollment_id: number;
  school_id: number;
  student_id: number;
  class_id: number;
  section_id: number | null;
  academic_year: string;
  enrollment_date: Date;
  enrollment_date_bs: string | null;
  status: string;
  is_current: boolean;
  roll_number: string | null;
  board_exam_registration: string | null;
  previous_academic_year: string | null;
  previous_class_id: number | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
}

export interface Parent {
  parent_id: number;
  school_id: number;
  user_id: number | null;
  guardian_code: string;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  display_name: string | null;
  relation_to_student: string;
  occupation: string | null;
  organization: string | null;
  designation: string | null;
  education_level: string | null;
  annual_income: number | null;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  whatsapp_number: string | null;
  province_id: number | null;
  district_id: number | null;
  municipality_id: number | null;
  ward_no: number | null;
  tole_en: string | null;
  address_en: string | null;
  tole_np: string | null;
  address_np: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface StudentGuardian {
  id: number;
  student_id: number;
  guardian_id: number;
  school_id: number;
  is_primary: boolean;
  is_emergency_contact: boolean;
  created_at: Date;
}

// ============================================================================
// TEACHERS & STAFF
// ============================================================================

export interface Teacher {
  teacher_id: number;
  school_id: number;
  teacher_code: string;
  employee_id: string;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  display_name: string | null;
  date_of_birth: Date | null;
  date_of_birth_bs: string | null;
  gender: string;
  blood_group: string | null;
  nationality: string | null;
  religion: string | null;
  highest_qualification: string | null;
  specialization: string | null;
  university_board: string | null;
  passing_year: number | null;
  teaching_license_number: string | null;
  license_expiry_date: Date | null;
  personal_mobile: string | null;
  official_mobile: string | null;
  personal_email: string | null;
  official_email: string | null;
  permanent_province_id: number | null;
  permanent_district_id: number | null;
  permanent_municipality_id: number | null;
  permanent_ward_no: number | null;
  permanent_tole_en: string | null;
  permanent_address_en: string | null;
  permanent_tole_np: string | null;
  permanent_address_np: string | null;
  joining_date: Date;
  joining_date_bs: string | null;
  employment_type: string;
  department: string | null;
  designation: string | null;
  current_status: string;
  is_active: boolean;
  citizenship_number: string | null;
  citizenship_issue_district: string | null;
  citizenship_issue_date: Date | null;
  citizenship_issue_date_bs: string | null;
  pan_number: string | null;
  ssf_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  caste_ethnicity_code: string | null;
  caste_ethnicity_name: string | null;
  marital_status: string | null;
  profile_photo_url: string | null;
  resignation_date: Date | null;
  resignation_date_bs: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Staff {
  staff_id: number;
  school_id: number;
  user_id: number | null;
  staff_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  department: string | null;
  designation: string | null;
  employment_type: string;
  joining_date: Date;
  current_status: string;
  is_active: boolean;
  citizenship_number: string | null;
  citizenship_issue_district: string | null;
  citizenship_issue_date: Date | null;
  pan_number: string | null;
  ssf_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  branch_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface LeaveType {
  leave_type_id: number;
  school_id: number;
  name: string;
  name_np: string | null;
  description: string | null;
  max_days_per_year: number | null;
  is_paid: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveRequest {
  leave_request_id: number;
  school_id: number;
  staff_id: number;
  leave_type_id: number;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason: string | null;
  status: string;
  approved_by: number | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Payroll {
  payroll_id: number;
  school_id: number;
  staff_id: number;
  month: number;
  year: number;
  salary_month_bs: string | null;
  basic_salary: number;
  allowances: number | null;
  deductions: number | null;
  house_rent_allowance: number | null;
  transport_allowance: number | null;
  medical_allowance: number | null;
  other_allowances: number | null;
  gross_salary: number | null;
  cit_deduction: number | null;
  ssf_employee_deduction: number | null;
  provident_fund: number | null;
  tax_deduction: number | null;
  other_deductions: number | null;
  total_deductions: number | null;
  net_salary: number;
  payment_date: Date | null;
  payment_status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  bank_name: string | null;
  account_number: string | null;
  remarks: string | null;
  is_tax_exempt: boolean | null;
  academic_year_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface StaffAttendance {
  attendance_id: number;
  school_id: number;
  staff_id: number;
  attendance_date: Date;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  biometric_log_id: string | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ATTENDANCE
// ============================================================================

export interface Attendance {
  attendance_id: number;
  school_id: number;
  student_id: number;
  class_id: number;
  section_id: number | null;
  attendance_date: Date;
  attendance_date_bs: string | null;
  status: string;
  academic_year: string;
  session: string;
  remarks: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  biometric_device_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
}

// ============================================================================
// EXAMS & MARKS
// ============================================================================

export interface Exam {
  exam_id: number;
  school_id: number;
  exam_name: string;
  exam_code: string;
  exam_type: string;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  exam_date: Date;
  exam_date_bs: string | null;
  start_time: string | null;
  end_time: string | null;
  full_marks: number;
  pass_marks: number;
  is_published: boolean;
  is_active: boolean;
  is_result_published: boolean;
  is_locked: boolean;
  remarks: string | null;
  academic_year: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ExamSchedule {
  schedule_id: number;
  school_id: number;
  exam_id: number;
  class_id: number;
  subject_id: number;
  exam_date: Date;
  exam_date_bs: string | null;
  start_time: string | null;
  end_time: string | null;
  room_number: string | null;
  full_marks: number;
  pass_marks: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface GradeSystem {
  grade_id: number;
  school_id: number;
  grade_name: string;
  grade_name_np: string | null;
  grade_points: number | null;
  min_mark: number;
  max_mark: number;
  remark: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Mark {
  mark_id: number;
  school_id: number;
  exam_id: number;
  student_id: number;
  theory_marks: number | null;
  practical_marks: number | null;
  total_marks: number | null;
  grade: string | null;
  grade_point: number | null;
  grade_np: string | null;
  class_rank: number | null;
  section_rank: number | null;
  remarks: string | null;
  is_submitted: boolean;
  is_verified: boolean;
  academic_year: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReportCard {
  report_id: number;
  school_id: number;
  student_id: number;
  exam_id: number;
  academic_year: string;
  total_gpa: number | null;
  total_percentage: number | null;
  class_position: number | null;
  section_position: number | null;
  principal_remark: string | null;
  teacher_remark: string | null;
  is_published: boolean;
  published_at: Date | null;
  generated_at: Date;
  updated_at: Date;
}

// ============================================================================
// FINANCE & FEES
// ============================================================================

export interface FeeCategory {
  category_id: number;
  school_id: number;
  category_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FeeStructure {
  structure_id: number;
  school_id: number;
  class_id: number | null;
  stream_id: number | null;
  section_id: number | null;
  academic_year: string;
  fee_type: string;
  amount: number;
  is_recurring: boolean;
  fee_frequency: string | null;
  due_date: Date | null;
  due_date_bs: string | null;
  is_mandatory: boolean | null;
  created_at: Date;
  updated_at: Date;
}

export interface Fee {
  fee_id: number;
  school_id: number;
  student_id: number;
  fee_type: string;
  amount: number;
  discount_amount: number | null;
  fine_amount: number | null;
  total_amount: number;
  due_date: Date;
  status: string;
  payment_date: Date | null;
  payment_date_bs: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  transaction_uuid: string | null;
  gateway_name: string | null;
  gateway_response: any | null;
  fiscal_year_bs: string | null;
  scholarship_percent: number;
  notes: string | null;
  is_active: boolean;
  academic_year: string | null;
  class_id: number | null;
  section_id: number | null;
  invoice_number: string | null;
  discount_type: string | null;
  discount_percent: number | null;
  fine_type: string | null;
  fine_percent: number | null;
  is_fully_paid: boolean;
  partial_payment_amount: number | null;
  payment_due_date: Date | null;
  late_fee_applied: number | null;
  received_by: number | null;
  bank_name: string | null;
  cheque_number: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
}

export interface Invoice {
  invoice_id: number;
  school_id: number;
  invoice_number: string;
  student_id: number;
  academic_year: string;
  class_id: number | null;
  section_id: number | null;
  total_amount: number;
  discount_amount: number;
  fine_amount: number;
  grand_total: number;
  paid_amount: number;
  due_date: Date | null;
  due_date_bs: string | null;
  status: string;
  issued_date: Date;
  issued_date_bs: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
}

export interface InvoiceItem {
  item_id: number;
  invoice_id: number;
  fee_type: string;
  fee_type_np: string | null;
  description: string | null;
  amount: number;
  created_at: Date;
}

export interface Payment {
  payment_id: number;
  school_id: number;
  invoice_id: number | null;
  student_id: number | null;
  amount: number;
  payment_date: Date;
  payment_date_bs: string | null;
  payment_time: Date;
  payment_method: string;
  transaction_id: string | null;
  transaction_uuid: string | null;
  gateway_name: string | null;
  gateway_response: any | null;
  received_by: number | null;
  bank_name: string | null;
  branch_name: string | null;
  cheque_number: string | null;
  cheque_date: Date | null;
  reference_number: string | null;
  remarks: string | null;
  is_verified: boolean;
  verified_by: number | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface StudentFeeDiscount {
  discount_id: number;
  school_id: number;
  student_id: number;
  fee_type: string | null;
  discount_type: string;
  discount_value: number;
  reason: string | null;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Expense {
  expense_id: number;
  school_id: number;
  expense_category: string;
  expense_date: Date;
  expense_date_bs: string | null;
  amount: number;
  description: string | null;
  voucher_number: string | null;
  attachment_path: string | null;
  payment_method: string | null;
  vendor_name: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// TIMETABLE
// ============================================================================

export interface Timetable {
  timetable_id: number;
  school_id: number;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number | null;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  room_number: string | null;
  academic_year: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// TRANSPORT
// ============================================================================

export interface Transport {
  transport_id: number;
  school_id: number;
  transport_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Vehicle {
  vehicle_id: number;
  transport_id: number;
  vehicle_number: string;
  vehicle_name: string | null;
  vehicle_type: string | null;
  capacity: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Route {
  route_id: number;
  transport_id: number;
  route_name: string;
  route_code: string | null;
  start_point: string | null;
  end_point: string | null;
  distance_km: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RouteStop {
  stop_id: number;
  route_id: number;
  stop_name: string;
  stop_order: number;
  arrival_time: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransportFee {
  transport_fee_id: number;
  school_id: number;
  route_id: number | null;
  academic_year: string;
  fee_amount: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransportAssignment {
  assignment_id: number;
  school_id: number;
  student_id: number;
  route_id: number;
  vehicle_id: number | null;
  academic_year: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// HOSTEL
// ============================================================================

export interface Hostel {
  hostel_id: number;
  school_id: number;
  hostel_name: string;
  hostel_name_np: string | null;
  hostel_type: string | null;
  total_rooms: number | null;
  capacity_per_room: number;
  monthly_fee: number | null;
  warden_name: string | null;
  warden_phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface HostelAllocation {
  allocation_id: number;
  school_id: number;
  student_id: number;
  hostel_id: number;
  room_number: string | null;
  bed_number: string | null;
  allocation_date: Date | null;
  allocation_date_bs: string | null;
  monthly_fee: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// LIBRARY
// ============================================================================

export interface Library {
  library_id: number;
  school_id: number;
  library_name: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Book {
  book_id: number;
  school_id: number;
  isbn: string | null;
  book_code: string;
  title: string;
  title_np: string | null;
  author: string | null;
  author_np: string | null;
  publisher: string | null;
  publisher_np: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  issued_copies: number | null;
  price: number | null;
  currency: string | null;
  rack_number: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BookIssue {
  issue_id: number;
  school_id: number;
  book_id: number;
  student_id: number | null;
  teacher_id: number | null;
  issue_date: Date;
  issue_date_bs: string | null;
  due_date: Date;
  due_date_bs: string | null;
  return_date: Date | null;
  return_date_bs: string | null;
  fine_amount: number;
  days_overdue: number | null;
  status: string;
  remarks: string | null;
  issued_by: number | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================

export interface Assignment {
  assignment_id: number;
  school_id: number;
  title: string;
  description: string | null;
  class_id: number;
  section_id: number | null;
  subject_id: number;
  teacher_id: number | null;
  due_date: Date;
  due_date_bs: string | null;
  total_marks: number;
  instructions: string | null;
  attachments: any;
  is_published: boolean;
  is_active: boolean;
  academic_year: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// NOTICES & COMMUNICATION
// ============================================================================

export interface Notice {
  notice_id: number;
  school_id: number;
  title: string;
  title_np: string | null;
  description: string | null;
  description_np: string | null;
  target_audience: string | null;
  class_id: number | null;
  section_id: number | null;
  publish_date: Date;
  expiry_date: Date | null;
  is_published: boolean;
  attachment_urls: any;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Notification {
  notification_id: number;
  school_id: number;
  user_id: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  sent_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SmsLog {
  log_id: number;
  school_id: number;
  phone_number: string;
  message: string;
  message_np: string | null;
  provider: string | null;
  provider_response: any | null;
  status: string;
  sent_at: Date | null;
  created_at: Date;
}

// ============================================================================
// AUDIT & SESSIONS
// ============================================================================

export interface AuditLog {
  log_id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface UserSession {
  session_id: number;
  user_id: number;
  refresh_token: string | null;
  expires_at: Date;
  created_at: Date;
}

// ============================================================================
// ASSETS & INVENTORY
// ============================================================================

export interface AssetCategory {
  category_id: number;
  school_id: number;
  category_name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Asset {
  asset_id: number;
  school_id: number;
  category_id: number | null;
  asset_name: string;
  asset_code: string | null;
  serial_number: string | null;
  purchase_date: Date | null;
  warranty_end_date: Date | null;
  purchase_price: number | null;
  current_value: number | null;
  status: string;
  location: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface InventoryItem {
  item_id: number;
  school_id: number;
  item_name: string;
  item_code: string | null;
  category: string | null;
  quantity: number;
  unit: string | null;
  reorder_level: number;
  unit_price: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ============================================================================
// NEPAL GEOGRAPHIC REFERENCE
// ============================================================================

export interface Province {
  province_id: number;
  province_name_en: string;
  province_name_np: string | null;
  province_code: string | null;
}

export interface District {
  district_id: number;
  province_id: number;
  district_name_en: string;
  district_name_np: string | null;
  district_code: string | null;
}

export interface LocalBody {
  local_body_id: number;
  district_id: number;
  local_body_name_en: string;
  local_body_name_np: string | null;
  local_body_type: string | null;
  local_body_code: string | null;
}

export interface Ward {
  ward_id: number;
  local_body_id: number;
  ward_number: number;
}

export interface EthnicityCode {
  ethnicity_id: number;
  ethnicity_code: string;
  ethnicity_name_en: string;
  ethnicity_name_np: string | null;
  category: string | null;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AcademicYearInfo {
  year: string;
  yearCode: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}
