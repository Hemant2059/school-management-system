import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

export interface Staff {
  staff_id: number;
  school_id: number;
  user_id: number;
  staff_code: string;
  first_name_en: string;
  middle_name_en: string | null;
  last_name_en: string;
  first_name_np: string | null;
  middle_name_np: string | null;
  last_name_np: string | null;
  email: string | null;
  mobile: string | null;
  department: string | null;
  designation: string | null;
  employment_type: string;
  joining_date: Date | null;
  current_status: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  pan_number?: string;
  position?: string;
}

export interface Payroll {
  payroll_id: number;
  school_id: number;
  staff_id: number;
  salary_month_bs: string;
  payment_date: Date;
  payment_date_bs: string;
  basic_salary: number;
  house_rent_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  gross_salary: number;
  cit_deduction: number;
  ssf_employee_contribution: number;
  ssf_employer_contribution: number;
  provident_fund: number;
  tax_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  pan_number: string | null;
  is_tax_exempt: boolean;
  is_paid: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveType {
  id: number;
  school_id: number;
  name: string;
  name_np: string | null;
  max_days_per_year: number | null;
  is_paid: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface LeaveRequest {
  leave_request_id: number;
  school_id: number;
  staff_id: number;
  leave_type_id: number;
  start_date: Date;
  start_date_bs: string;
  end_date: Date;
  end_date_bs: string;
  days_requested: number;
  reason: string | null;
  status: string;
  approved_by: number | null;
  rejection_reason: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class HrService {
  constructor(private db: DatabaseService) {}

  async createStaff(createDto: CreateStaffDto): Promise<Staff> {
    const existing = await this.db.queryOne<Staff>(
      `SELECT staff_id FROM staff WHERE user_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [createDto.userId, createDto.schoolId],
    );
    if (existing) {
      throw new BadRequestException(
        'Staff record already exists for this user',
      );
    }

    const [countResult] = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM staff WHERE school_id = $1`,
      [createDto.schoolId],
    );
    const count = parseInt(countResult.count, 10);
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const staffCode = `STF-${yearSuffix}-${String(count + 1).padStart(5, '0')}`;

    const result = await this.db.insert<Staff>(
      `INSERT INTO staff (
        school_id, user_id, staff_code, employee_id, first_name, last_name, email, mobile,
        department, designation, employment_type, joining_date, current_status, is_active,
        first_name_en, middle_name_en, last_name_en,
        first_name_np, middle_name_np, last_name_np, department_np, designation_np, employment_type_np
      ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.userId,
        staffCode,
        createDto.firstNameEn,
        createDto.lastNameEn,
        createDto.email,
        createDto.mobile,
        createDto.department,
        createDto.position,
        createDto.employmentType || 'PERMANENT',
        createDto.hireDate,
        'ACTIVE',
        true,
        createDto.firstNameEn,
        createDto.middleNameEn ?? null,
        createDto.lastNameEn,
        createDto.firstNameNp ?? null,
        createDto.middleNameNp ?? null,
        createDto.lastNameNp ?? null,
        createDto.departmentNp ?? null,
        createDto.designationNp ?? null,
        createDto.employmentTypeNp ?? null,
      ],
    );
    return result;
  }

  async findAllStaff(schoolId: number): Promise<Staff[]> {
    return this.db.query<Staff>(
      `SELECT * FROM staff WHERE school_id = $1 AND is_active = true AND deleted_at IS NULL`,
      [schoolId],
    );
  }

  async findOneStaff(id: number, schoolId?: number): Promise<Staff> {
    let query = `SELECT * FROM staff WHERE staff_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }

    const staff = await this.db.queryOne<Staff>(query, params);
    if (!staff) throw new NotFoundException(`Staff with ID ${id} not found`);
    return staff;
  }

  private calculateNepalTax(
    annualIncome: number,
    isTaxExempt: boolean,
    panNumber?: string,
  ): number {
    if (isTaxExempt || !panNumber) return 0;

    let tax = 0;
    let remaining = annualIncome;

    if (remaining > 0) {
      const amount = Math.min(remaining, 500000);
      tax += amount * 0.01;
      remaining -= amount;
    }
    if (remaining > 0) {
      const amount = Math.min(remaining, 700000);
      tax += amount * 0.1;
      remaining -= amount;
    }
    if (remaining > 0) {
      const amount = Math.min(remaining, 1500000);
      tax += amount * 0.2;
      remaining -= amount;
    }
    if (remaining > 0) {
      const amount = Math.min(remaining, 1300000);
      tax += amount * 0.3;
      remaining -= amount;
    }
    if (remaining > 0) {
      tax += remaining * 0.36;
    }

    return tax;
  }

  async processPayroll(processDto: ProcessPayrollDto): Promise<Payroll> {
    const existing = await this.db.queryOne<Payroll>(
      `SELECT payroll_id FROM payrolls 
       WHERE staff_id = $1 AND school_id = $2 AND salary_month_bs = $3`,
      [processDto.staffId, processDto.schoolId, processDto.salaryMonthBs],
    );
    if (existing) {
      throw new BadRequestException('Payroll already processed for this month');
    }

    const staff = await this.findOneStaff(
      processDto.staffId,
      processDto.schoolId,
    );

    const houseRent =
      processDto.houseRentAllowance || processDto.basicSalary * 0.4;
    const transport =
      processDto.transportAllowance || processDto.basicSalary * 0.15;
    const medical = processDto.medicalAllowance || processDto.basicSalary * 0.1;

    const grossSalary =
      processDto.basicSalary +
      houseRent +
      transport +
      medical +
      (processDto.otherAllowances || 0);

    const citDeduction = processDto.citDeduction || 0;
    const providentFund =
      processDto.providentFund || processDto.basicSalary * 0.1;

    const ssfEmployee = grossSalary * 0.11;
    const ssfEmployer = grossSalary * 0.11;

    const annualIncome = grossSalary * 12;
    const annualTax = this.calculateNepalTax(
      annualIncome,
      processDto.isTaxExempt || false,
      processDto.panNumber || staff.pan_number || undefined,
    );
    const monthlyTax = annualTax / 12;

    const totalDeductions =
      citDeduction +
      providentFund +
      ssfEmployee +
      monthlyTax +
      (processDto.otherDeductions || 0);

    const netSalary = grossSalary - totalDeductions;

    // Both dates come from the frontend — the backend stores them as given.
    const paymentDate = processDto.paymentDate
      ? new Date(processDto.paymentDate)
      : new Date();
    const paymentDateBs = processDto.paymentDateBs || null;

    const result = await this.db.insert<Payroll>(
      `INSERT INTO payrolls (
        school_id, staff_id, salary_month_bs, payment_date, payment_date_bs,
        basic_salary, house_rent_allowance, transport_allowance, medical_allowance,
        other_allowances, gross_salary, cit_deduction, ssf_employee_contribution,
        ssf_employer_contribution, provident_fund, tax_deduction, other_deductions,
        total_deductions, net_salary, pan_number, is_tax_exempt, is_paid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        processDto.schoolId,
        processDto.staffId,
        processDto.salaryMonthBs,
        paymentDate,
        paymentDateBs,
        processDto.basicSalary,
        houseRent,
        transport,
        medical,
        processDto.otherAllowances || 0,
        grossSalary,
        citDeduction,
        ssfEmployee,
        ssfEmployer,
        providentFund,
        monthlyTax,
        processDto.otherDeductions || 0,
        totalDeductions,
        netSalary,
        processDto.panNumber || staff.pan_number,
        processDto.isTaxExempt || false,
        true,
      ],
    );
    return result;
  }

  async getStaffPayroll(
    staffId: number,
    schoolId: number,
    year?: string,
  ): Promise<Payroll[]> {
    let query = `SELECT * FROM payrolls WHERE staff_id = $1 AND school_id = $2`;
    const params: any[] = [staffId, schoolId];

    if (year) {
      params.push(`${year}-%`);
      query += ` AND salary_month_bs LIKE $${params.length}`;
    }

    query += ` ORDER BY payment_date DESC`;

    return this.db.query<Payroll>(query, params);
  }

  async createLeaveRequest(
    createDto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    if (createDto.endDate < createDto.startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // BS dates come from the frontend — the backend stores them as given.
    const startBs = createDto.startDateBs || null;
    const endBs = createDto.endDateBs || null;

    const result = await this.db.insert<LeaveRequest>(
      `INSERT INTO leave_requests (
        school_id, staff_id, leave_type_id, start_date, start_date_bs,
        end_date, end_date_bs, days_requested, reason, reason_np, status, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.staffId,
        createDto.leaveTypeId,
        createDto.startDate,
        startBs,
        createDto.endDate,
        endBs,
        createDto.daysRequested,
        createDto.reason,
        createDto.reasonNp ?? null,
        'PENDING',
        true,
      ],
    );
    return result;
  }

  // ---- Leave types (admin-managed; EN+NP stored verbatim) ----
  async createLeaveType(createDto: CreateLeaveTypeDto): Promise<LeaveType> {
    const dup = await this.db.queryOne<LeaveType>(
      `SELECT id FROM leave_types WHERE school_id = $1 AND name = $2`,
      [createDto.schoolId, createDto.name],
    );
    if (dup) {
      throw new BadRequestException(
        `Leave type '${createDto.name}' already exists for this school`,
      );
    }
    return this.db.insert<LeaveType>(
      `INSERT INTO leave_types (school_id, name, name_np, max_days_per_year, is_paid, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.name,
        createDto.nameNp || null,
        createDto.maxDaysPerYear ?? null,
        createDto.isPaid ?? false,
      ],
    );
  }

  async getLeaveTypes(schoolId: number): Promise<LeaveType[]> {
    return this.db.query<LeaveType>(
      `SELECT * FROM leave_types WHERE school_id = $1 AND is_active = true ORDER BY name ASC`,
      [schoolId],
    );
  }

  async updateLeaveType(
    id: number,
    schoolId: number,
    updateDto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    const existing = await this.db.queryOne<LeaveType>(
      `SELECT * FROM leave_types WHERE id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (!existing) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }
    const fieldMap: Record<string, string> = {
      name: 'name',
      nameNp: 'name_np',
      maxDaysPerYear: 'max_days_per_year',
      isPaid: 'is_paid',
      isActive: 'is_active',
    };
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      const v = (updateDto as any)[key];
      if (v !== undefined) {
        updates.push(`${col} = $${i++}`);
        params.push(v);
      }
    }
    if (updates.length === 0) return existing;
    params.push(id, schoolId);
    return this.db.insert<LeaveType>(
      `UPDATE leave_types SET ${updates.join(', ')} WHERE id = $${i} AND school_id = $${i + 1} RETURNING *`,
      params,
    );
  }

  async deleteLeaveType(id: number, schoolId: number): Promise<void> {
    const inUse = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM leave_requests WHERE leave_type_id = $1 AND status = 'PENDING'`,
      [id],
    );
    if (inUse && parseInt(inUse.count, 10) > 0) {
      throw new BadRequestException(
        'Cannot delete leave type with pending requests',
      );
    }
    const n = await this.db.update(
      `UPDATE leave_types SET is_active = false WHERE id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (n === 0) {
      throw new NotFoundException(`Leave type with ID ${id} not found`);
    }
  }

  async approveLeaveRequest(
    leaveRequestId: number,
    approvedBy: number,
    schoolId?: number,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.db.queryOne<LeaveRequest>(
      schoolId === undefined
        ? `SELECT * FROM leave_requests WHERE leave_request_id = $1`
        : `SELECT * FROM leave_requests WHERE leave_request_id = $1 AND school_id = $2`,
      schoolId === undefined ? [leaveRequestId] : [leaveRequestId, schoolId],
    );
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Leave request is not pending');
    }

    const result = await this.db.insert<LeaveRequest>(
      schoolId === undefined
        ? `UPDATE leave_requests SET status = 'APPROVED', approved_by = $1 WHERE leave_request_id = $2 RETURNING *`
        : `UPDATE leave_requests SET status = 'APPROVED', approved_by = $1 WHERE leave_request_id = $2 AND school_id = $3 RETURNING *`,
      schoolId === undefined
        ? [approvedBy, leaveRequestId]
        : [approvedBy, leaveRequestId, schoolId],
    );
    return result;
  }

  async rejectLeaveRequest(
    leaveRequestId: number,
    rejectionReason: string,
    rejectionReasonNp?: string,
    schoolId?: number,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.db.queryOne<LeaveRequest>(
      schoolId === undefined
        ? `SELECT * FROM leave_requests WHERE leave_request_id = $1`
        : `SELECT * FROM leave_requests WHERE leave_request_id = $1 AND school_id = $2`,
      schoolId === undefined ? [leaveRequestId] : [leaveRequestId, schoolId],
    );
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Leave request is not pending');
    }

    const result = await this.db.insert<LeaveRequest>(
      schoolId === undefined
        ? `UPDATE leave_requests SET status = 'REJECTED', rejection_reason = $1, rejection_reason_np = $2 WHERE leave_request_id = $3 RETURNING *`
        : `UPDATE leave_requests SET status = 'REJECTED', rejection_reason = $1, rejection_reason_np = $2 WHERE leave_request_id = $3 AND school_id = $4 RETURNING *`,
      schoolId === undefined
        ? [rejectionReason, rejectionReasonNp || null, leaveRequestId]
        : [
            rejectionReason,
            rejectionReasonNp || null,
            leaveRequestId,
            schoolId,
          ],
    );
    return result;
  }

  getNepalHolidays(year: number): any[] {
    const holidays = [
      {
        dateBs: `${year}-01-01`,
        name: 'Nepali New Year',
        nameNp: 'नेपाली नयाँ वर्ष',
      },
      { dateBs: `${year}-06-15`, name: 'Dashain Start', nameNp: 'दशैं सुरु' },
      { dateBs: `${year}-06-25`, name: 'Dashain End', nameNp: 'दशैं सकियो' },
      { dateBs: `${year}-07-01`, name: 'Tihar Start', nameNp: 'तिहार सुरु' },
      { dateBs: `${year}-07-05`, name: 'Bhai Tika', nameNp: 'भाइ टीका' },
      {
        dateBs: `${year}-09-01`,
        name: 'Maghe Sankranti',
        nameNp: 'माघे संक्रान्ति',
      },
      { dateBs: `${year}-11-01`, name: 'Chhat', nameNp: 'छठ' },
    ];
    return holidays;
  }

  async generatePayslip(payrollId: number): Promise<any> {
    const payroll = await this.db.queryOne<Payroll>(
      `SELECT * FROM payrolls WHERE payroll_id = $1`,
      [payrollId],
    );
    if (!payroll) throw new NotFoundException('Payroll record not found');

    const staff = await this.findOneStaff(payroll.staff_id);

    const getFullName = (lang: 'en' | 'np') => {
      if (lang === 'np' && staff.first_name_np) {
        return `${staff.first_name_np} ${staff.middle_name_np || ''} ${staff.last_name_np}`.trim();
      }
      return `${staff.first_name_en} ${staff.middle_name_en || ''} ${staff.last_name_en}`.trim();
    };

    return {
      payrollId,
      staffName: getFullName('en'),
      staffNameNp: getFullName('np'),
      position: staff.designation,
      salaryMonth: payroll.salary_month_bs,
      paymentDate: payroll.payment_date,
      paymentDateBs: payroll.payment_date_bs,
      earnings: {
        basicSalary: NepaliNumberUtil.formatCurrency(
          payroll.basic_salary,
          'en',
        ),
        houseRentAllowance: NepaliNumberUtil.formatCurrency(
          payroll.house_rent_allowance,
          'en',
        ),
        transportAllowance: NepaliNumberUtil.formatCurrency(
          payroll.transport_allowance,
          'en',
        ),
        medicalAllowance: NepaliNumberUtil.formatCurrency(
          payroll.medical_allowance,
          'en',
        ),
        grossSalary: NepaliNumberUtil.formatCurrency(
          payroll.gross_salary,
          'en',
        ),
      },
      deductions: {
        citDeduction: NepaliNumberUtil.formatCurrency(
          payroll.cit_deduction,
          'en',
        ),
        ssfEmployeeContribution: NepaliNumberUtil.formatCurrency(
          payroll.ssf_employee_contribution,
          'en',
        ),
        providentFund: NepaliNumberUtil.formatCurrency(
          payroll.provident_fund,
          'en',
        ),
        taxDeduction: NepaliNumberUtil.formatCurrency(
          payroll.tax_deduction,
          'en',
        ),
        totalDeductions: NepaliNumberUtil.formatCurrency(
          payroll.total_deductions,
          'en',
        ),
      },
      netSalary: NepaliNumberUtil.formatCurrency(payroll.net_salary, 'en'),
      netSalaryNp: NepaliNumberUtil.formatCurrency(payroll.net_salary, 'ne'),
      panNumber: payroll.pan_number,
      remarks: null,
    };
  }
}
