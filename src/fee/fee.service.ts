import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  FeeCategory as DbFeeCategory,
  FeeStructure,
  Fee,
  Payment,
  LateFineRule,
  StudentBalance,
  FeeWaiverRequest,
  SiblingDiscount,
  Scholarship,
  EnhancedPayment,
  EnhancedFee,
} from '../database/entities/interfaces';
import { NepaliDateUtil } from '../utils/nepali-date.util';

export interface FeeCategory extends DbFeeCategory {
  category_code?: string;
  is_system_defined?: boolean;
}

@Injectable()
export class FeeService {
  constructor(private db: DatabaseService) {}

  async createFeeCategory(createDto: {
    schoolId: number;
    categoryName: string;
    description?: string;
  }): Promise<FeeCategory> {
    return this.db.insert<FeeCategory>(
      `INSERT INTO fee_categories (school_id, category_name, description, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.categoryName,
        createDto.description || null,
      ],
    );
  }

  async findAllFeeCategories(schoolId: number): Promise<FeeCategory[]> {
    return this.db.query<FeeCategory>(
      `SELECT * FROM fee_categories WHERE school_id = $1 AND is_active = true ORDER BY category_name ASC`,
      [schoolId],
    );
  }

  async findFeeCategory(id: number): Promise<FeeCategory> {
    const category = await this.db.queryOne<FeeCategory>(
      `SELECT * FROM fee_categories WHERE category_id = $1 AND is_active = true`,
      [id],
    );

    if (!category) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    return category;
  }

  async removeFeeCategory(id: number): Promise<void> {
    await this.findFeeCategory(id);
    await this.db.query(
      `UPDATE fee_categories SET is_active = false, deleted_at = NOW() WHERE category_id = $1`,
      [id],
    );
  }

  async createFeeStructure(createDto: {
    schoolId: number;
    classId?: number;
    streamId?: number;
    sectionId?: number;
    academicYear: string;
    feeType: string;
    amount: number;
    isRecurring?: boolean;
    feeFrequency?: string;
    dueDate?: Date;
    dueDateBs?: string;
    isMandatory?: boolean;
  }): Promise<FeeStructure> {
    return this.db.insert<FeeStructure>(
      `INSERT INTO fee_structures (school_id, class_id, stream_id, section_id, academic_year, fee_type, amount, is_recurring, fee_frequency, due_date, due_date_bs, is_mandatory)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.classId || null,
        createDto.streamId || null,
        createDto.sectionId || null,
        createDto.academicYear,
        createDto.feeType,
        createDto.amount,
        createDto.isRecurring ?? true,
        createDto.feeFrequency || null,
        createDto.dueDate || null,
        createDto.dueDateBs || null,
        createDto.isMandatory ?? true,
      ],
    );
  }

  async getFeeStructureForClass(
    schoolId: number,
    classId: number | string,
    sectionId?: number | string,
    academicYear?: string,
  ): Promise<FeeStructure[]> {
    let query = `SELECT * FROM fee_structures WHERE school_id = $1 AND class_id = $2 AND is_active = true`;
    const params: any[] = [schoolId, classId];

    if (sectionId) {
      params.push(sectionId);
      query += ` AND section_id = $${params.length}`;
    }
    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }

    query += ` ORDER BY due_date ASC`;
    return this.db.query<FeeStructure>(query, params);
  }

  async createStudentFee(createDto: {
    schoolId: number;
    studentId: number;
    feeType: string;
    amount: number;
    discountAmount?: number;
    fineAmount?: number;
    totalAmount: number;
    dueDate: Date;
    academicYear?: string;
    classId?: number;
    sectionId?: number;
    invoiceNumber?: string;
    discountType?: string;
    discountPercent?: number;
    fineType?: string;
    finePercent?: number;
    scholarshipPercent?: number;
    notes?: string;
  }): Promise<EnhancedFee> {
    const result = await this.db.insert<EnhancedFee>(
      `INSERT INTO fees (school_id, student_id, fee_type, amount, discount_amount, fine_amount, total_amount, due_date, status, academic_year, class_id, section_id, invoice_number, discount_type, discount_percent, fine_type, fine_percent, scholarship_percent, notes, is_active, is_fully_paid, paid_amount, remaining_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true, false, 0, $7)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.feeType,
        createDto.amount,
        createDto.discountAmount || null,
        createDto.fineAmount || null,
        createDto.totalAmount,
        createDto.dueDate,
        createDto.academicYear || null,
        createDto.classId || null,
        createDto.sectionId || null,
        createDto.invoiceNumber || null,
        createDto.discountType || null,
        createDto.discountPercent || null,
        createDto.fineType || null,
        createDto.finePercent || null,
        createDto.scholarshipPercent || 0,
        createDto.notes || null,
      ],
    );
    return result;
  }

  async getStudentFees(
    studentId: number,
    academicYear?: string,
  ): Promise<EnhancedFee[]> {
    let query = `SELECT * FROM fees WHERE student_id = $1 AND is_active = true`;
    const params: any[] = [studentId];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }

    query += ` ORDER BY due_date ASC`;
    return this.db.query<EnhancedFee>(query, params);
  }

  async processPayment(
    createDto: {
      schoolId: number;
      feeId?: number;
      invoiceId?: number;
      studentId: number;
      amount: number;
      paymentDate: Date;
      paymentDateBs?: string;
      paymentMethod: string;
      transactionId?: string;
      transactionUuid?: string;
      gatewayName?: string;
      receivedBy?: number;
      bankName?: string;
      branchName?: string;
      chequeNumber?: string;
      chequeDate?: Date;
      referenceNumber?: string;
      remarks?: string;
      idempotencyKey?: string;
    },
    userId?: number,
  ): Promise<EnhancedPayment> {
    if (createDto.idempotencyKey) {
      const existing = await this.db.queryOne<EnhancedPayment>(
        `SELECT * FROM payments WHERE idempotency_key = $1`,
        [createDto.idempotencyKey],
      );
      if (existing) {
        return existing;
      }
    }

    const payment = await this.db.insert<EnhancedPayment>(
      `INSERT INTO payments (school_id, fee_id, invoice_id, student_id, amount, payment_date, payment_date_bs, payment_method, transaction_id, transaction_uuid, gateway_name, received_by, bank_name, branch_name, cheque_number, cheque_date, reference_number, remarks, idempotency_key, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, false)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.feeId || null,
        createDto.invoiceId || null,
        createDto.studentId,
        createDto.amount,
        createDto.paymentDate,
        createDto.paymentDateBs ||
          NepaliDateUtil.adToBs(createDto.paymentDate).bsDate,
        createDto.paymentMethod,
        createDto.transactionId || null,
        createDto.transactionUuid || null,
        createDto.gatewayName || null,
        createDto.receivedBy || userId || null,
        createDto.bankName || null,
        createDto.branchName || null,
        createDto.chequeNumber || null,
        createDto.chequeDate || null,
        createDto.referenceNumber || null,
        createDto.remarks || null,
        createDto.idempotencyKey || null,
      ],
    );

    if (createDto.feeId) {
      await this.updateFeePaymentStatus(createDto.feeId, createDto.amount);
    }

    return payment;
  }

  private async updateFeePaymentStatus(
    feeId: number,
    paymentAmount: number,
  ): Promise<void> {
    const fee = await this.db.queryOne<EnhancedFee>(
      `SELECT * FROM fees WHERE fee_id = $1`,
      [feeId],
    );

    if (!fee) {
      throw new NotFoundException(`Fee with ID ${feeId} not found`);
    }

    const newPaidAmount = (fee.paid_amount || 0) + paymentAmount;
    const totalAmount = fee.total_amount || fee.amount;
    const isFullyPaid = newPaidAmount >= totalAmount;

    await this.db.update(
      `UPDATE fees SET 
        paid_amount = $1, 
        remaining_amount = $2, 
        is_fully_paid = $3,
        last_payment_date = NOW(),
        status = CASE WHEN $3 THEN 'paid' ELSE 'partial' END
       WHERE fee_id = $4`,
      [newPaidAmount, totalAmount - newPaidAmount, isFullyPaid, feeId],
    );
  }

  async processPartialPayment(
    feeId: number,
    createDto: {
      schoolId: number;
      amount: number;
      paymentDate: Date;
      paymentMethod: string;
      transactionId?: string;
      remarks?: string;
      idempotencyKey?: string;
    },
    userId?: number,
  ): Promise<EnhancedPayment> {
    const fee = await this.db.queryOne<EnhancedFee>(
      `SELECT * FROM fees WHERE fee_id = $1 AND school_id = $2`,
      [feeId, createDto.schoolId],
    );

    if (!fee) {
      throw new NotFoundException(`Fee with ID ${feeId} not found`);
    }

    const feeTotal = fee.total_amount ?? fee.amount;
    const remaining =
      (fee.remaining_amount ?? feeTotal) - (fee.paid_amount ?? 0);
    if (createDto.amount > remaining) {
      throw new BadRequestException(
        `Payment amount exceeds remaining balance. Remaining: NPR ${remaining}`,
      );
    }

    return this.processPayment(
      {
        ...createDto,
        studentId: fee.student_id,
        feeId: feeId,
      },
      userId,
    );
  }

  async getStudentBalance(
    studentId: number,
    academicYear: string,
  ): Promise<StudentBalance> {
    let balance = await this.db.queryOne<StudentBalance>(
      `SELECT * FROM student_balances WHERE student_id = $1 AND academic_year = $2`,
      [studentId, academicYear],
    );

    if (!balance) {
      balance = await this.db.insert<StudentBalance>(
        `INSERT INTO student_balances (school_id, student_id, academic_year, brought_forward_amount, total_paid, total_adjusted, total_due, current_balance)
         VALUES ((SELECT school_id FROM students WHERE student_id = $1), $1, $2, 0, 0, 0, 0, 0)
         RETURNING *`,
        [studentId, academicYear],
      );
    }

    const fees = await this.getStudentFees(studentId, academicYear);
    const totalDue = fees.reduce(
      (sum, f) => sum + (f.total_amount || f.amount),
      0,
    );
    const totalPaid = fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);

    return {
      ...balance,
      total_due: totalDue,
      total_paid: totalPaid,
      current_balance: balance.brought_forward_amount + totalPaid - totalDue,
    };
  }

  async carryForwardBalance(
    studentId: number,
    fromAcademicYear: string,
    toAcademicYear: string,
    amount: number,
    notes?: string,
  ): Promise<StudentBalance> {
    const student = await this.db.queryOne<any>(
      `SELECT school_id FROM students WHERE student_id = $1`,
      [studentId],
    );

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const existing = await this.db.queryOne<StudentBalance>(
      `SELECT * FROM student_balances WHERE student_id = $1 AND academic_year = $2`,
      [studentId, toAcademicYear],
    );

    if (existing) {
      await this.db.update(
        `UPDATE student_balances SET brought_forward_amount = $1, notes = $2, updated_at = NOW() WHERE balance_id = $3`,
        [amount, notes || existing.notes, existing.balance_id],
      );
      return this.getStudentBalance(studentId, toAcademicYear);
    }

    return this.db.insert<StudentBalance>(
      `INSERT INTO student_balances (school_id, student_id, academic_year, brought_forward_amount, total_paid, total_adjusted, total_due, current_balance, notes)
       VALUES ($1, $2, $3, $4, 0, 0, 0, $4, $5)
       RETURNING *`,
      [student.school_id, studentId, toAcademicYear, amount, notes || null],
    );
  }

  async calculateLateFine(
    schoolId: number,
    dueDate: Date,
    amount: number,
  ): Promise<{ fineAmount: number; daysOverdue: number; rule?: LateFineRule }> {
    const today = new Date();
    const daysOverdue = Math.max(
      0,
      Math.floor(
        (today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    if (daysOverdue === 0) {
      return { fineAmount: 0, daysOverdue: 0 };
    }

    const rule = await this.db.queryOne<LateFineRule>(
      `SELECT * FROM late_fine_rules 
       WHERE school_id = $1 AND is_active = true AND applicable_from <= $2
       ORDER BY applicable_from DESC LIMIT 1`,
      [schoolId, today],
    );

    if (!rule) {
      return { fineAmount: 0, daysOverdue };
    }

    const effectiveDays = Math.max(
      0,
      daysOverdue - (rule.grace_period_days || 0),
    );
    let fineAmount = 0;

    switch (rule.fine_type) {
      case 'per_day':
        fineAmount = effectiveDays * rule.fine_amount;
        break;
      case 'flat':
        fineAmount = rule.fine_amount;
        break;
      case 'percentage':
        fineAmount = (amount * rule.fine_amount) / 100;
        break;
    }

    if (rule.max_fine_amount && fineAmount > rule.max_fine_amount) {
      fineAmount = rule.max_fine_amount;
    }

    return { fineAmount, daysOverdue, rule };
  }

  async createLateFineRule(createDto: {
    schoolId: number;
    ruleName: string;
    fineType: 'per_day' | 'flat' | 'percentage';
    fineAmount: number;
    gracePeriodDays?: number;
    maxFineAmount?: number;
    applicableFrom: Date;
  }): Promise<LateFineRule> {
    return this.db.insert<LateFineRule>(
      `INSERT INTO late_fine_rules (school_id, rule_name, fine_type, fine_amount, grace_period_days, max_fine_amount, applicable_from, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.ruleName,
        createDto.fineType,
        createDto.fineAmount,
        createDto.gracePeriodDays || 0,
        createDto.maxFineAmount || null,
        createDto.applicableFrom,
      ],
    );
  }

  async getLateFineRules(schoolId: number): Promise<LateFineRule[]> {
    return this.db.query<LateFineRule>(
      `SELECT * FROM late_fine_rules WHERE school_id = $1 AND is_active = true ORDER BY applicable_from DESC`,
      [schoolId],
    );
  }

  async createScholarship(createDto: {
    schoolId: number;
    studentId: number;
    scholarshipType: string;
    discountPercent?: number;
    discountAmount?: number;
    academicYear: string;
    reason?: string;
    requestedBy?: number;
  }): Promise<Scholarship> {
    return this.db.insert<Scholarship>(
      `INSERT INTO scholarships (school_id, student_id, scholarship_type, discount_percent, discount_amount, academic_year, reason, status, requested_by, requested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.scholarshipType,
        createDto.discountPercent || null,
        createDto.discountAmount || null,
        createDto.academicYear,
        createDto.reason || null,
        createDto.requestedBy || null,
      ],
    );
  }

  async approveScholarship(
    scholarshipId: number,
    approvedBy: number,
    remarks?: string,
  ): Promise<Scholarship> {
    const scholarship = await this.db.queryOne<Scholarship>(
      `SELECT * FROM scholarships WHERE scholarship_id = $1`,
      [scholarshipId],
    );

    if (!scholarship) {
      throw new NotFoundException(
        `Scholarship with ID ${scholarshipId} not found`,
      );
    }

    if (scholarship.status !== 'pending') {
      throw new BadRequestException('Scholarship is not in pending status');
    }

    return this.db.insert<Scholarship>(
      `UPDATE scholarships SET status = 'approved', approved_by = $1, approved_at = NOW(), remarks = $2
       WHERE scholarship_id = $3
       RETURNING *`,
      [approvedBy, remarks || null, scholarshipId],
    );
  }

  async rejectScholarship(
    scholarshipId: number,
    approvedBy: number,
    remarks: string,
  ): Promise<Scholarship> {
    return this.db.insert<Scholarship>(
      `UPDATE scholarships SET status = 'rejected', approved_by = $1, approved_at = NOW(), remarks = $2
       WHERE scholarship_id = $3
       RETURNING *`,
      [approvedBy, remarks, scholarshipId],
    );
  }

  async getScholarships(
    schoolId: number,
    academicYear?: string,
    status?: string,
  ): Promise<Scholarship[]> {
    let query = `SELECT * FROM scholarships WHERE school_id = $1`;
    const params: any[] = [schoolId];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY requested_at DESC`;
    return this.db.query<Scholarship>(query, params);
  }

  async createSiblingDiscount(createDto: {
    schoolId: number;
    studentId: number;
    siblingCount: number;
    discountPercent: number;
    academicYear: string;
    familyId?: string;
    approvedBy?: number;
  }): Promise<SiblingDiscount> {
    const discountAmount = 0;

    return this.db.insert<SiblingDiscount>(
      `INSERT INTO sibling_discounts (school_id, student_id, sibling_count, discount_percent, discount_amount, academic_year, family_id, is_active, approved_by, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW())
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.siblingCount,
        createDto.discountPercent,
        discountAmount,
        createDto.academicYear,
        createDto.familyId || null,
        createDto.approvedBy || null,
      ],
    );
  }

  async getSiblingDiscounts(
    schoolId: number,
    academicYear?: string,
  ): Promise<SiblingDiscount[]> {
    let query = `SELECT * FROM sibling_discounts WHERE school_id = $1 AND is_active = true`;
    const params: any[] = [schoolId];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }

    return this.db.query<SiblingDiscount>(query, params);
  }

  async createFeeWaiverRequest(createDto: {
    schoolId: number;
    studentId: number;
    feeId?: number;
    waiverType: string;
    requestedAmount: number;
    reason?: string;
    supportingDocuments?: string[];
    requestedBy?: number;
  }): Promise<FeeWaiverRequest> {
    return this.db.insert<FeeWaiverRequest>(
      `INSERT INTO fee_waiver_requests (school_id, student_id, fee_id, waiver_type, requested_amount, reason, supporting_documents, status, requested_by, requested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW())
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.feeId || null,
        createDto.waiverType,
        createDto.requestedAmount,
        createDto.reason || null,
        createDto.supportingDocuments || null,
        createDto.requestedBy || null,
      ],
    );
  }

  async approveFeeWaiver(
    waiverId: number,
    approvedBy: number,
    approvedAmount: number,
    remarks?: string,
  ): Promise<FeeWaiverRequest> {
    const waiver = await this.db.queryOne<FeeWaiverRequest>(
      `SELECT * FROM fee_waiver_requests WHERE waiver_id = $1`,
      [waiverId],
    );

    if (!waiver) {
      throw new NotFoundException(`Waiver with ID ${waiverId} not found`);
    }

    if (waiver.status !== 'pending') {
      throw new BadRequestException('Waiver request is not in pending status');
    }

    const result = await this.db.insert<FeeWaiverRequest>(
      `UPDATE fee_waiver_requests SET status = 'approved', approved_amount = $1, approved_by = $2, approved_at = NOW(), remarks = $3
       WHERE waiver_id = $4
       RETURNING *`,
      [approvedAmount, approvedBy, remarks || null, waiverId],
    );

    if (waiver.fee_id) {
      const fee = await this.db.queryOne<EnhancedFee>(
        `SELECT * FROM fees WHERE fee_id = $1`,
        [waiver.fee_id],
      );
      if (fee) {
        const newDiscount = (fee.discount_amount || 0) + approvedAmount;
        const newTotal = Math.max(
          0,
          (fee.total_amount || fee.amount) - newDiscount,
        );
        await this.db.update(
          `UPDATE fees SET discount_amount = $1, total_amount = $2, remaining_amount = $2 - paid_amount WHERE fee_id = $3`,
          [newDiscount, newTotal, waiver.fee_id],
        );
      }
    }

    return result;
  }

  async rejectFeeWaiver(
    waiverId: number,
    approvedBy: number,
    remarks: string,
  ): Promise<FeeWaiverRequest> {
    return this.db.insert<FeeWaiverRequest>(
      `UPDATE fee_waiver_requests SET status = 'rejected', approved_by = $1, approved_at = NOW(), remarks = $2
       WHERE waiver_id = $3
       RETURNING *`,
      [approvedBy, remarks, waiverId],
    );
  }

  async getFeeWaiverRequests(
    schoolId: number,
    status?: string,
    studentId?: number,
  ): Promise<FeeWaiverRequest[]> {
    let query = `SELECT * FROM fee_waiver_requests WHERE school_id = $1`;
    const params: any[] = [schoolId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (studentId) {
      params.push(studentId);
      query += ` AND student_id = $${params.length}`;
    }

    query += ` ORDER BY requested_at DESC`;
    return this.db.query<FeeWaiverRequest>(query, params);
  }

  async generateReceipt(transactionId: number): Promise<EnhancedPayment> {
    const payment = await this.db.queryOne<EnhancedPayment>(
      `SELECT * FROM payments WHERE payment_id = $1`,
      [transactionId],
    );

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${transactionId} not found`);
    }

    return payment;
  }

  async getOverdueFees(
    schoolId: number,
    daysOverdue?: number,
  ): Promise<EnhancedFee[]> {
    const overdueDays = daysOverdue || 0;
    return this.db.query<EnhancedFee>(
      `SELECT f.* FROM fees f
       WHERE f.school_id = $1 
       AND f.is_active = true 
       AND f.is_fully_paid = false
       AND f.due_date < NOW() - INTERVAL '${overdueDays} days'
       ORDER BY f.due_date ASC`,
      [schoolId],
    );
  }

  async getPaymentHistory(
    studentId: number,
    academicYear?: string,
  ): Promise<EnhancedPayment[]> {
    let query = `SELECT p.* FROM payments p 
                 WHERE p.student_id = $1`;
    const params: any[] = [studentId];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND p.academic_year = $${params.length}`;
    }

    query += ` ORDER BY p.payment_date DESC`;
    return this.db.query<EnhancedPayment>(query, params);
  }
}
