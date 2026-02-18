import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import {
  FeeCategory as DbFeeCategory,
  FeeStructure,
  Fee,
  Payment,
  Invoice,
  InvoiceItem,
  StudentFeeDiscount,
  Expense,
} from '../database/entities/interfaces';

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
  }): Promise<Fee> {
    return this.db.insert<Fee>(
      `INSERT INTO fees (school_id, student_id, fee_type, amount, discount_amount, fine_amount, total_amount, due_date, status, academic_year, class_id, section_id, invoice_number, discount_type, discount_percent, fine_type, fine_percent, scholarship_percent, notes, is_active, is_fully_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true, false)
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
  }

  async getStudentFees(
    studentId: number,
    academicYear?: string,
  ): Promise<Fee[]> {
    let query = `SELECT * FROM fees WHERE student_id = $1 AND is_active = true`;
    const params: any[] = [studentId];

    if (academicYear) {
      params.push(academicYear);
      query += ` AND academic_year = $${params.length}`;
    }

    query += ` ORDER BY due_date ASC`;
    return this.db.query<Fee>(query, params);
  }

  async processPayment(
    createDto: {
      schoolId: number;
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
    },
    userId?: number,
  ): Promise<Payment> {
    return this.db.insert<Payment>(
      `INSERT INTO payments (school_id, invoice_id, student_id, amount, payment_date, payment_date_bs, payment_method, transaction_id, transaction_uuid, gateway_name, received_by, bank_name, branch_name, cheque_number, cheque_date, reference_number, remarks, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, false)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.invoiceId || null,
        createDto.studentId,
        createDto.amount,
        createDto.paymentDate,
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
        createDto.referenceNumber || null,
        createDto.remarks || null,
      ],
    );
  }

  async generateReceipt(transactionId: number): Promise<Payment> {
    const payment = await this.db.queryOne<Payment>(
      `SELECT * FROM payments WHERE payment_id = $1`,
      [transactionId],
    );

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${transactionId} not found`);
    }

    return payment;
  }

  async getOverdueFees(schoolId: number, daysOverdue?: number): Promise<Fee[]> {
    const overdueDays = daysOverdue || 0;
    return this.db.query<Fee>(
      `SELECT f.* FROM fees f
       WHERE f.school_id = $1 
       AND f.is_active = true 
       AND f.is_fully_paid = false
       AND f.due_date < NOW() - INTERVAL '${overdueDays} days'
       ORDER BY f.due_date ASC`,
      [schoolId],
    );
  }
}
