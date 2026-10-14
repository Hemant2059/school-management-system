import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  FeeCategory as DbFeeCategory,
  FeeStructure,
  LateFineRule,
  StudentBalance,
  FeeWaiverRequest,
  SiblingDiscount,
  Scholarship,
  EnhancedPayment,
  EnhancedFee,
} from '../database/entities/interfaces';
import { CreateDiscountRuleDto } from './dto/create-discount-rule.dto';
import { UpdateDiscountRuleDto } from './dto/update-discount-rule.dto';
import { CreatePenaltyRuleDto } from './dto/create-penalty-rule.dto';
import { UpdatePenaltyRuleDto } from './dto/update-penalty-rule.dto';
import { ApplyInvoiceDiscountDto } from './dto/apply-invoice-discount.dto';

export interface FeeCategory extends DbFeeCategory {
  category_code?: string;
  is_system_defined?: boolean;
}

export interface DiscountRule {
  discount_rule_id: number;
  school_id: number;
  code: string;
  name_en: string;
  name_np: string | null;
  discount_type: 'PERCENT' | 'FIXED';
  value: number;
  applies_to: string;
  min_siblings: number | null;
  valid_from_ad: Date | null;
  valid_to_ad: Date | null;
  valid_from_bs: string | null;
  valid_to_bs: string | null;
  is_stackable: boolean;
  is_active: boolean;
}

export interface PenaltyRule {
  penalty_rule_id: number;
  school_id: number;
  code: string;
  name_en: string;
  name_np: string | null;
  fee_head_id: number | null;
  grace_days: number;
  mode: 'FIXED_PER_DAY' | 'PERCENT_PER_MONTH' | 'FLAT';
  amount: number;
  percent: number;
  max_cap: number | null;
  is_active: boolean;
}

export interface InvoiceDiscount {
  student_discount_id: number;
  school_id: number;
  student_id: number;
  discount_rule_id: number;
  academic_year_id: number;
  invoice_id: number | null;
  approved_by: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  created_at: Date;
}

@Injectable()
export class FeeService {
  constructor(private db: DatabaseService) {}

  async createFeeCategory(createDto: {
    schoolId: number;
    categoryName: string;
    description?: string;
    categoryNameNp?: string;
    descriptionNp?: string;
  }): Promise<FeeCategory> {
    return this.db.insert<FeeCategory>(
      `INSERT INTO fee_categories (school_id, category_name, category_name_np, description, description_np, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.categoryName,
        (createDto as any).categoryNameNp || null,
        createDto.description || null,
        (createDto as any).descriptionNp || null,
      ],
    );
  }

  async findAllFeeCategories(schoolId: number): Promise<FeeCategory[]> {
    return this.db.query<FeeCategory>(
      `SELECT * FROM fee_categories WHERE school_id = $1 AND is_active = true ORDER BY category_name ASC`,
      [schoolId],
    );
  }

  async findFeeCategory(id: number, schoolId?: number): Promise<FeeCategory> {
    const params: any[] = [id];
    let query = `SELECT * FROM fee_categories WHERE id = $1 AND is_active = true`;
    if (schoolId !== undefined) {
      params.push(schoolId);
      query += ` AND school_id = $2`;
    }
    const category = await this.db.queryOne<FeeCategory>(query, params);

    if (!category) {
      throw new NotFoundException(`Fee category with ID ${id} not found`);
    }

    return category;
  }

  async removeFeeCategory(id: number, schoolId?: number): Promise<void> {
    await this.findFeeCategory(id, schoolId);
    const params: any[] = [id];
    let query = `UPDATE fee_categories SET is_active = false, deleted_at = NOW() WHERE id = $1`;
    if (schoolId !== undefined) {
      params.push(schoolId);
      query += ` AND school_id = $2`;
    }
    await this.db.query(query, params);
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
    notesNp?: string;
  }): Promise<EnhancedFee> {
    const result = await this.db.insert<EnhancedFee>(
      `INSERT INTO fees (school_id, student_id, fee_type, amount, discount_amount, fine_amount, total_amount, due_date, status, academic_year, class_id, section_id, invoice_number, discount_type, discount_percent, fine_type, fine_percent, scholarship_percent, notes, notes_np, is_active, is_fully_paid, paid_amount, remaining_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, true, false, 0, $7)
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
        createDto.notesNp || null,
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
      chequeDateBs?: string;
      referenceNumber?: string;
      remarks?: string;
      remarksNp?: string;
      idempotencyKey?: string;
    },
    userId?: number,
  ): Promise<EnhancedPayment> {
    if (createDto.idempotencyKey) {
      const existing = await this.db.queryOne<EnhancedPayment>(
        `SELECT * FROM payments WHERE idempotency_key = $1 AND school_id = $2`,
        [createDto.idempotencyKey, createDto.schoolId],
      );
      if (existing) {
        return existing;
      }
    }

    const payment = await this.db.insert<EnhancedPayment>(
      `INSERT INTO payments (school_id, fee_id, invoice_id, student_id, amount, payment_date, payment_date_bs, payment_method, transaction_id, transaction_uuid, gateway_name, received_by, bank_name, branch_name, cheque_number, cheque_date, cheque_date_bs, reference_number, remarks, remarks_np, idempotency_key, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, false)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.feeId || null,
        createDto.invoiceId || null,
        createDto.studentId,
        createDto.amount,
        createDto.paymentDate,
        // BS dates come from the frontend — the backend stores them as given.
        createDto.paymentDateBs || null,
        createDto.paymentMethod,
        createDto.transactionId || null,
        createDto.transactionUuid || null,
        createDto.gatewayName || null,
        createDto.receivedBy || userId || null,
        createDto.bankName || null,
        createDto.branchName || null,
        createDto.chequeNumber || null,
        createDto.chequeDate || null,
        createDto.chequeDateBs || null,
        createDto.referenceNumber || null,
        createDto.remarks || null,
        createDto.remarksNp || null,
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
    const remaining = fee.remaining_amount ?? feeTotal - (fee.paid_amount ?? 0);
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
    notesNp?: string,
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
        `UPDATE student_balances SET brought_forward_amount = $1, notes = $2, notes_np = $3, updated_at = NOW() WHERE balance_id = $4`,
        [amount, notes || existing.notes, notesNp || null, existing.balance_id],
      );
      return this.getStudentBalance(studentId, toAcademicYear);
    }

    return this.db.insert<StudentBalance>(
      `INSERT INTO student_balances (school_id, student_id, academic_year, brought_forward_amount, total_paid, total_adjusted, total_due, current_balance, notes, notes_np)
       VALUES ($1, $2, $3, $4, 0, 0, 0, $4, $5, $6)
       RETURNING *`,
      [
        student.school_id,
        studentId,
        toAcademicYear,
        amount,
        notes || null,
        notesNp || null,
      ],
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
    ruleNameNp?: string;
    fineType: 'per_day' | 'flat' | 'percentage';
    fineAmount: number;
    gracePeriodDays?: number;
    maxFineAmount?: number;
    applicableFrom: Date;
  }): Promise<LateFineRule> {
    return this.db.insert<LateFineRule>(
      `INSERT INTO late_fine_rules (school_id, rule_name, rule_name_np, fine_type, fine_amount, grace_period_days, max_fine_amount, applicable_from, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.ruleName,
        createDto.ruleNameNp || null,
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

  // ---- Discount rules (admin-managed; EN+NP stored verbatim) ----
  async createDiscountRule(
    createDto: CreateDiscountRuleDto,
  ): Promise<DiscountRule> {
    const dup = await this.db.queryOne<DiscountRule>(
      `SELECT discount_rule_id FROM discount_rules WHERE school_id = $1 AND code = $2`,
      [createDto.schoolId, createDto.code],
    );
    if (dup) {
      throw new BadRequestException(
        `Discount rule code '${createDto.code}' already exists for this school`,
      );
    }
    return this.db.insert<DiscountRule>(
      `INSERT INTO discount_rules (school_id, code, name_en, name_np, discount_type, value, applies_to, min_siblings, valid_from_ad, valid_to_ad, valid_from_bs, valid_to_bs, is_stackable, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.code,
        createDto.nameEn,
        createDto.nameNp || null,
        createDto.discountType,
        createDto.value,
        createDto.appliesTo || 'ALL',
        createDto.minSiblings ?? null,
        createDto.validFromAd || null,
        createDto.validToAd || null,
        createDto.validFromBs || null,
        createDto.validToBs || null,
        createDto.isStackable ?? false,
      ],
    );
  }

  async getDiscountRules(schoolId: number): Promise<DiscountRule[]> {
    return this.db.query<DiscountRule>(
      `SELECT * FROM discount_rules WHERE school_id = $1 AND is_active = true ORDER BY code ASC`,
      [schoolId],
    );
  }

  async updateDiscountRule(
    id: number,
    schoolId: number,
    updateDto: UpdateDiscountRuleDto,
  ): Promise<DiscountRule> {
    const existing = await this.db.queryOne<DiscountRule>(
      `SELECT * FROM discount_rules WHERE discount_rule_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (!existing) {
      throw new NotFoundException(`Discount rule with ID ${id} not found`);
    }
    const fieldMap: Record<string, string> = {
      code: 'code',
      nameEn: 'name_en',
      nameNp: 'name_np',
      discountType: 'discount_type',
      value: 'value',
      appliesTo: 'applies_to',
      minSiblings: 'min_siblings',
      validFromAd: 'valid_from_ad',
      validToAd: 'valid_to_ad',
      validFromBs: 'valid_from_bs',
      validToBs: 'valid_to_bs',
      isStackable: 'is_stackable',
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
    return this.db.insert<DiscountRule>(
      `UPDATE discount_rules SET ${updates.join(', ')} WHERE discount_rule_id = $${i} AND school_id = $${i + 1} RETURNING *`,
      params,
    );
  }

  async deleteDiscountRule(id: number, schoolId: number): Promise<void> {
    const n = await this.db.update(
      `UPDATE discount_rules SET is_active = false WHERE discount_rule_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (n === 0) {
      throw new NotFoundException(`Discount rule with ID ${id} not found`);
    }
  }

  // ---- Penalty rules (admin-managed; EN+NP stored verbatim) ----
  async createPenaltyRule(
    createDto: CreatePenaltyRuleDto,
  ): Promise<PenaltyRule> {
    const dup = await this.db.queryOne<PenaltyRule>(
      `SELECT penalty_rule_id FROM penalty_rules WHERE school_id = $1 AND code = $2`,
      [createDto.schoolId, createDto.code],
    );
    if (dup) {
      throw new BadRequestException(
        `Penalty rule code '${createDto.code}' already exists for this school`,
      );
    }
    return this.db.insert<PenaltyRule>(
      `INSERT INTO penalty_rules (school_id, code, name_en, name_np, fee_head_id, grace_days, mode, amount, percent, max_cap, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.code,
        createDto.nameEn,
        createDto.nameNp || null,
        createDto.feeHeadId ?? null,
        createDto.graceDays ?? 0,
        createDto.mode,
        createDto.amount ?? 0,
        createDto.percent ?? 0,
        createDto.maxCap ?? null,
      ],
    );
  }

  async getPenaltyRules(schoolId: number): Promise<PenaltyRule[]> {
    return this.db.query<PenaltyRule>(
      `SELECT * FROM penalty_rules WHERE school_id = $1 AND is_active = true ORDER BY code ASC`,
      [schoolId],
    );
  }

  async updatePenaltyRule(
    id: number,
    schoolId: number,
    updateDto: UpdatePenaltyRuleDto,
  ): Promise<PenaltyRule> {
    const existing = await this.db.queryOne<PenaltyRule>(
      `SELECT * FROM penalty_rules WHERE penalty_rule_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (!existing) {
      throw new NotFoundException(`Penalty rule with ID ${id} not found`);
    }
    const fieldMap: Record<string, string> = {
      code: 'code',
      nameEn: 'name_en',
      nameNp: 'name_np',
      feeHeadId: 'fee_head_id',
      graceDays: 'grace_days',
      mode: 'mode',
      amount: 'amount',
      percent: 'percent',
      maxCap: 'max_cap',
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
    return this.db.insert<PenaltyRule>(
      `UPDATE penalty_rules SET ${updates.join(', ')} WHERE penalty_rule_id = $${i} AND school_id = $${i + 1} RETURNING *`,
      params,
    );
  }

  async deletePenaltyRule(id: number, schoolId: number): Promise<void> {
    const n = await this.db.update(
      `UPDATE penalty_rules SET is_active = false WHERE penalty_rule_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
    if (n === 0) {
      throw new NotFoundException(`Penalty rule with ID ${id} not found`);
    }
  }

  // ---- Invoice discounts: applies discount_rules to invoices ----
  // Rule evaluation (window, stacking, amount) lives here so apply-time
  // validation and approve-time posting always agree.
  private async evaluateInvoiceDiscount(
    schoolId: number,
    studentId: number,
    discountRuleId: number,
    academicYearId: number | undefined,
    invoiceId: number | undefined,
  ): Promise<{
    rule: DiscountRule;
    invoice: any;
    yearId: number;
    amount: number;
  }> {
    const rule = await this.db.queryOne<DiscountRule>(
      `SELECT * FROM discount_rules WHERE discount_rule_id = $1 AND school_id = $2 AND is_active = true`,
      [discountRuleId, schoolId],
    );
    if (!rule) {
      throw new NotFoundException(
        `Active discount rule with ID ${discountRuleId} not found`,
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (rule.valid_from_ad && String(rule.valid_from_ad).slice(0, 10) > today) {
      throw new BadRequestException('Discount rule is not yet valid');
    }
    if (rule.valid_to_ad && String(rule.valid_to_ad).slice(0, 10) < today) {
      throw new BadRequestException('Discount rule has expired');
    }

    const student = await this.db.queryOne(
      `SELECT student_id FROM students WHERE student_id = $1 AND school_id = $2`,
      [studentId, schoolId],
    );
    if (!student) {
      throw new NotFoundException(
        `Student with ID ${studentId} not found in this school`,
      );
    }

    let invoice: any = null;
    if (invoiceId !== undefined && invoiceId !== null) {
      invoice = await this.db.queryOne(
        `SELECT * FROM fee_invoices WHERE invoice_id = $1 AND school_id = $2 AND student_id = $3`,
        [invoiceId, schoolId, studentId],
      );
      if (!invoice) {
        throw new NotFoundException(
          `Invoice with ID ${invoiceId} not found for this student`,
        );
      }
    } else {
      invoice = await this.db.queryOne(
        `SELECT * FROM fee_invoices
         WHERE school_id = $1 AND student_id = $2 AND status IN ('ISSUED','PARTIAL','OVERDUE')
         ORDER BY invoice_date_ad DESC LIMIT 1`,
        [schoolId, studentId],
      );
      if (!invoice) {
        throw new NotFoundException('No open invoice found for this student');
      }
    }
    if (!['ISSUED', 'PARTIAL', 'OVERDUE'].includes(invoice.status)) {
      throw new BadRequestException(
        `Invoice is ${invoice.status}; discounts apply only to open invoices`,
      );
    }

    const yearId = academicYearId ?? invoice.academic_year_id;
    const subtotal = parseFloat(invoice.subtotal) || 0;
    const alreadyDiscounted = parseFloat(invoice.discount_total) || 0;
    const paid = parseFloat(invoice.paid_amount) || 0;
    const raw =
      rule.discount_type === 'PERCENT'
        ? (subtotal * parseFloat(String(rule.value))) / 100
        : parseFloat(String(rule.value));
    const amount =
      Math.round(
        Math.min(raw, Math.max(subtotal - alreadyDiscounted - paid, 0)) * 100,
      ) / 100;
    if (amount <= 0) {
      throw new BadRequestException('Nothing left to discount on this invoice');
    }

    if (!rule.is_stackable) {
      const prior = await this.db.queryOne(
        `SELECT student_discount_id FROM student_fee_discounts
         WHERE invoice_id = $1 AND status = 'APPROVED' LIMIT 1`,
        [invoice.invoice_id],
      );
      if (prior) {
        throw new BadRequestException(
          `Rule '${rule.code}' does not stack; invoice already has an approved discount`,
        );
      }
    }

    return { rule, invoice, yearId, amount };
  }

  async applyInvoiceDiscount(
    createDto: ApplyInvoiceDiscountDto,
  ): Promise<InvoiceDiscount & { computed_amount: number }> {
    const { invoice, yearId, amount } = await this.evaluateInvoiceDiscount(
      createDto.schoolId,
      createDto.studentId,
      createDto.discountRuleId,
      createDto.academicYearId,
      createDto.invoiceId,
    );
    const rec = await this.db.insert<InvoiceDiscount>(
      `INSERT INTO student_fee_discounts (school_id, student_id, discount_rule_id, academic_year_id, invoice_id, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.discountRuleId,
        yearId,
        invoice.invoice_id,
      ],
    );
    return { ...rec, computed_amount: amount };
  }

  async getInvoiceDiscounts(
    schoolId: number,
    studentId?: number,
    status?: string,
  ): Promise<any[]> {
    let query = `
      SELECT d.*, r.code AS rule_code, r.name_en AS rule_name, r.name_np AS rule_name_np,
             r.discount_type, r.value AS rule_value, i.invoice_no
      FROM student_fee_discounts d
      JOIN discount_rules r ON r.discount_rule_id = d.discount_rule_id
      LEFT JOIN fee_invoices i ON i.invoice_id = d.invoice_id
      WHERE d.school_id = $1`;
    const params: any[] = [schoolId];
    if (studentId !== undefined) {
      params.push(studentId);
      query += ` AND d.student_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }
    query += ` ORDER BY d.created_at DESC`;
    return this.db.query(query, params);
  }

  async approveInvoiceDiscount(
    id: number,
    approvedBy: number,
  ): Promise<InvoiceDiscount & { applied_amount: number }> {
    return this.db.transaction(async (client) => {
      const recRows = await client.query(
        `SELECT * FROM student_fee_discounts WHERE student_discount_id = $1`,
        [id],
      );
      const rec = recRows.rows[0];
      if (!rec) {
        throw new NotFoundException(`Invoice discount with ID ${id} not found`);
      }
      if (rec.status !== 'PENDING') {
        throw new BadRequestException('Discount is not in pending status');
      }
      // Re-evaluate at approve time (rule may have changed since application).
      const { invoice, amount } = await this.evaluateInvoiceDiscount(
        rec.school_id,
        rec.student_id,
        rec.discount_rule_id,
        rec.academic_year_id,
        rec.invoice_id,
      );
      await client.query(
        `UPDATE fee_invoices SET discount_total = discount_total + $1 WHERE invoice_id = $2`,
        [amount, invoice.invoice_id],
      );
      const updated = await client.query(
        `UPDATE student_fee_discounts SET status = 'APPROVED', approved_by = $1 WHERE student_discount_id = $2 RETURNING *`,
        [approvedBy, id],
      );
      return { ...updated.rows[0], applied_amount: amount };
    });
  }

  async rejectInvoiceDiscount(
    id: number,
    approvedBy: number,
  ): Promise<InvoiceDiscount> {
    const rec = await this.db.queryOne<InvoiceDiscount>(
      `SELECT * FROM student_fee_discounts WHERE student_discount_id = $1`,
      [id],
    );
    if (!rec) {
      throw new NotFoundException(`Invoice discount with ID ${id} not found`);
    }
    if (rec.status !== 'PENDING') {
      throw new BadRequestException('Discount is not in pending status');
    }
    return this.db.insert<InvoiceDiscount>(
      `UPDATE student_fee_discounts SET status = 'REJECTED', approved_by = $1 WHERE student_discount_id = $2 RETURNING *`,
      [approvedBy, id],
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
    reasonNp?: string;
    requestedBy?: number;
  }): Promise<Scholarship> {
    return this.db.insert<Scholarship>(
      `INSERT INTO scholarships (school_id, student_id, scholarship_type, discount_percent, discount_amount, academic_year, reason, reason_np, status, requested_by, requested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW())
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.scholarshipType,
        createDto.discountPercent || null,
        createDto.discountAmount || null,
        createDto.academicYear,
        createDto.reason || null,
        createDto.reasonNp || null,
        createDto.requestedBy || null,
      ],
    );
  }

  async approveScholarship(
    scholarshipId: number,
    approvedBy: number,
    remarks?: string,
    remarksNp?: string,
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
      `UPDATE scholarships SET status = 'approved', approved_by = $1, approved_at = NOW(), remarks = $2, remarks_np = $3
       WHERE scholarship_id = $4
       RETURNING *`,
      [approvedBy, remarks || null, remarksNp || null, scholarshipId],
    );
  }

  async rejectScholarship(
    scholarshipId: number,
    approvedBy: number,
    remarks: string,
    remarksNp?: string,
  ): Promise<Scholarship> {
    return this.db.insert<Scholarship>(
      `UPDATE scholarships SET status = 'rejected', approved_by = $1, approved_at = NOW(), remarks = $2, remarks_np = $3
       WHERE scholarship_id = $4
       RETURNING *`,
      [approvedBy, remarks, remarksNp || null, scholarshipId],
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
    reasonNp?: string;
    supportingDocuments?: string[];
    requestedBy?: number;
  }): Promise<FeeWaiverRequest> {
    return this.db.insert<FeeWaiverRequest>(
      `INSERT INTO fee_waiver_requests (school_id, student_id, fee_id, waiver_type, requested_amount, reason, reason_np, supporting_documents, status, requested_by, requested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW())
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.feeId || null,
        createDto.waiverType,
        createDto.requestedAmount,
        createDto.reason || null,
        createDto.reasonNp || null,
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
    remarksNp?: string,
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
      `UPDATE fee_waiver_requests SET status = 'approved', approved_amount = $1, approved_by = $2, approved_at = NOW(), remarks = $3, remarks_np = $4
       WHERE waiver_id = $5
       RETURNING *`,
      [
        approvedAmount,
        approvedBy,
        remarks || null,
        remarksNp || null,
        waiverId,
      ],
    );

    if (waiver.fee_id) {
      const fee = await this.db.queryOne<EnhancedFee>(
        `SELECT * FROM fees WHERE fee_id = $1`,
        [waiver.fee_id],
      );
      if (fee) {
        const newDiscount = (fee.discount_amount || 0) + approvedAmount;
        const newTotal = Math.max(0, fee.amount - newDiscount);
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
    remarksNp?: string,
  ): Promise<FeeWaiverRequest> {
    return this.db.insert<FeeWaiverRequest>(
      `UPDATE fee_waiver_requests SET status = 'rejected', approved_by = $1, approved_at = NOW(), remarks = $2, remarks_np = $3
       WHERE waiver_id = $4
       RETURNING *`,
      [approvedBy, remarks, remarksNp || null, waiverId],
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
       AND f.due_date < NOW() - ($2 || ' days')::interval
       ORDER BY f.due_date ASC`,
      [schoolId, String(overdueDays)],
    );
  }

  async getPaymentHistory(
    studentId: number,
    academicYear?: string,
  ): Promise<EnhancedPayment[]> {
    let query = `SELECT p.* FROM payments p
                 LEFT JOIN fees f ON f.fee_id = p.fee_id
                 WHERE p.student_id = $1`;
    const params: any[] = [studentId];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND f.academic_year = $${params.length}`;
    }

    query += ` ORDER BY p.payment_date DESC`;
    return this.db.query<EnhancedPayment>(query, params);
  }
}
