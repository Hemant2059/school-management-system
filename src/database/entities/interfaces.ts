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
