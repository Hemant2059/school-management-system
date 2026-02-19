export interface Attendance {
  attendance_id: number;
  school_id: number;
  student_id: number;
  class_id: number | null;
  section_id: number | null;
  academic_year: string;
  attendance_date: Date;
  attendance_date_bs: string | null;
  status: string;
  remarks?: string;
  created_by?: number;
  created_at: Date;
}

export interface Exam {
  exam_id: number;
  school_id: number;
  name: string;
  exam_type: string;
  academic_year: string;
  start_date: Date;
  end_date: Date;
  is_published: boolean;
  created_by?: number;
  created_at: Date;
}

export interface ExamSchedule {
  schedule_id: number;
  exam_id: number;
  subject_id: number;
  class_id: number;
  exam_date: Date;
  start_time: string;
  end_time: string;
  full_marks: number;
  pass_marks: number;
  is_announced: boolean;
}

export interface GradeSystem {
  grade_id: number;
  school_id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Mark {
  mark_id: number;
  exam_id: number;
  student_id: number;
  subject_id: number;
  class_id: number;
  marks_obtained: number;
  grade?: string;
  remarks?: string;
  created_by?: number;
  created_at: Date;
}

export interface ReportCard {
  report_id: number;
  student_id: number;
  class_id: number;
  exam_id: number;
  academic_year: string;
  total_marks: number;
  percentage: number;
  grade: string;
  rank?: number;
  is_published: boolean;
}

export interface FeeCategory {
  category_id: number;
  school_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface FeeStructure {
  structure_id: number;
  school_id: number;
  class_id: number;
  academic_year: string;
  total_amount: number;
  installments: number;
}

export interface Fee {
  fee_id: number;
  school_id: number;
  category_id: number;
  class_id: number;
  academic_year: string;
  amount: number;
  is_optional: boolean;
}

export interface Payment {
  payment_id: number;
  student_id: number;
  invoice_id: number;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_date: Date;
  collected_by?: number;
}

export interface Invoice {
  invoice_id: number;
  student_id: number;
  school_id: number;
  academic_year: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  generated_at: Date;
}

export interface InvoiceItem {
  item_id: number;
  invoice_id: number;
  fee_id: number;
  amount: number;
}

export interface StudentFeeDiscount {
  discount_id: number;
  student_id: number;
  fee_id: number;
  discount_type: string;
  discount_amount: number;
  reason?: string;
}

export interface Expense {
  expense_id: number;
  school_id: number;
  category: string;
  amount: number;
  description?: string;
  expense_date: Date;
  created_by?: number;
}

export interface LateFineRule {
  fine_rule_id: number;
  school_id: number;
  rule_name: string;
  fine_type: 'per_day' | 'flat' | 'percentage';
  fine_amount: number;
  grace_period_days: number;
  max_fine_amount?: number;
  applicable_from: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StudentBalance {
  balance_id: number;
  school_id: number;
  student_id: number;
  academic_year: string;
  brought_forward_amount: number;
  total_paid: number;
  total_adjusted: number;
  total_due: number;
  current_balance: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FeeWaiverRequest {
  waiver_id: number;
  school_id: number;
  student_id: number;
  fee_id?: number;
  waiver_type: string;
  requested_amount: number;
  approved_amount?: number;
  reason?: string;
  supporting_documents?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by?: number;
  approved_by?: number;
  requested_at: Date;
  approved_at?: Date;
  remarks?: string;
}

export interface SiblingDiscount {
  sibling_discount_id: number;
  school_id: number;
  family_id?: string;
  student_id: number;
  sibling_count: number;
  discount_percent: number;
  discount_amount?: number;
  is_active: boolean;
  academic_year: string;
  approved_by?: number;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Scholarship {
  scholarship_id: number;
  school_id: number;
  student_id: number;
  scholarship_type: string;
  discount_percent?: number;
  discount_amount?: number;
  academic_year: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by?: number;
  approved_by?: number;
  requested_at: Date;
  approved_at?: Date;
  remarks?: string;
}

export interface EnhancedPayment extends Payment {
  idempotency_key?: string;
  is_reversed?: boolean;
  reversed_by?: number;
  reversed_at?: Date;
  reversal_reason?: string;
  fee_id?: number;
  is_verified?: boolean;
  verified_by?: number;
  verified_at?: Date;
}

export interface EnhancedFee {
  fee_id: number;
  school_id: number;
  student_id: number;
  fee_type: string;
  amount: number;
  discount_amount?: number;
  fine_amount?: number;
  total_amount?: number;
  due_date: Date;
  status: string;
  academic_year?: string;
  class_id?: number;
  section_id?: number;
  invoice_number?: string;
  discount_type?: string;
  discount_percent?: number;
  fine_type?: string;
  fine_percent?: number;
  scholarship_percent?: number;
  notes?: string;
  is_active: boolean;
  paid_amount: number;
  remaining_amount?: number;
  is_fully_paid: boolean;
  last_payment_date?: Date;
  payment_history?: any[];
}
