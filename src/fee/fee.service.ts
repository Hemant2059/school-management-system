import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { NepaliNumberUtil } from '../utils/nepali-number.util';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { FeeCategory } from './entities/fee-category.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { StudentFee } from './entities/student-fee.entity';
import { FeeTransaction } from './entities/fee-transaction.entity';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateStudentFeeDto } from './dto/create-student-fee.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeCategory)
    private feeCategoryRepository: Repository<FeeCategory>,
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(StudentFee)
    private studentFeeRepository: Repository<StudentFee>,
    @InjectRepository(FeeTransaction)
    private feeTransactionRepository: Repository<FeeTransaction>,
  ) {}

  // Fee Category Management
  async createFeeCategory(
    createDto: CreateFeeCategoryDto,
  ): Promise<FeeCategory> {
    const existing = await this.feeCategoryRepository.findOne({
      where: {
        categoryCode: createDto.categoryCode,
        schoolId: createDto.schoolId,
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new BadRequestException('Fee category code already exists');
    }

    const category = this.feeCategoryRepository.create(createDto);
    return this.feeCategoryRepository.save(category);
  }

  async findAllFeeCategories(schoolId: number): Promise<FeeCategory[]> {
    return this.feeCategoryRepository.find({
      where: { schoolId, isActive: true, deletedAt: IsNull() },
    });
  }

  // Fee Structure Management
  async createFeeStructure(
    createDto: CreateFeeStructureDto,
  ): Promise<FeeStructure> {
    const structure = this.feeStructureRepository.create(createDto);
    return this.feeStructureRepository.save(structure);
  }

  async getFeeStructureForClass(
    schoolId: number,
    classId: number,
    sectionId?: number,
    academicYearId?: number,
  ): Promise<FeeStructure[]> {
    const where: any = {
      schoolId,
      classId,
      isActive: true,
      deletedAt: IsNull(),
    };
    if (sectionId) where.sectionId = sectionId;
    if (academicYearId) where.academicYearId = academicYearId;

    return this.feeStructureRepository.find({ where });
  }

  // Student Fee Management
  async createStudentFee(createDto: CreateStudentFeeDto): Promise<StudentFee> {
    // ✅ FIXED: Removed non-existent receiptNumber field
    const studentFee = this.studentFeeRepository.create({
      studentId: createDto.studentId,
      feeStructureId: createDto.feeStructureId,
      academicYearId: createDto.academicYearId,
      totalAmount: createDto.totalAmount,
      discountAmount: createDto.discountAmount || 0,
      waiverAmount: createDto.waiverAmount || 0,
      installmentNumber: createDto.installmentNumber || 1,
      dueDate: createDto.dueDate,
      status: 'PENDING',
      paidAmount: 0,
      isActive: true,
    });

    return this.studentFeeRepository.save(studentFee); // ✅ Now returns single StudentFee
  }

  async getStudentFees(
    studentId: number,
    academicYearId?: number,
  ): Promise<StudentFee[]> {
    const where: any = { studentId, isActive: true, deletedAt: IsNull() };
    if (academicYearId) where.academicYearId = academicYearId;

    return this.studentFeeRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // Payment Processing with Nepal Gateways
  async processPayment(
    createDto: CreatePaymentDto,
    userId: number = 1,
  ): Promise<any> {
    const studentFee = await this.studentFeeRepository.findOne({
      where: { studentFeeId: createDto.studentFeeId, deletedAt: IsNull() },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    if (studentFee.status === 'PAID') {
      throw new BadRequestException('Fee is already fully paid');
    }

    // ✅ Generate unique receipt number (for transaction, not student fee)
    const count = await this.feeTransactionRepository.count();
    const nepaliYear = NepaliDateUtil.getCurrentFiscalYear().bsYear;
    const receiptNumber = `FEE-${nepaliYear}-${String(count + 1).padStart(6, '0')}`;

    // Generate transaction reference
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const transactionReference = `${createDto.paymentMethod}-${timestamp}-${random}`;

    // ✅ Create transaction with receiptNumber field
    const transaction = this.feeTransactionRepository.create({
      studentFeeId: createDto.studentFeeId,
      amount: createDto.amount,
      paymentMethod: createDto.paymentMethod,
      transactionReference:
        createDto.transactionReference || transactionReference,
      bankName: createDto.bankName,
      chequeNumber: createDto.chequeNumber,
      receivedBy: userId,
      receiptNumber: receiptNumber, // ✅ Set receiptNumber field
      remarks: createDto.remarks,
      isVerified: ['CASH', 'BANK', 'CHEQUE'].includes(createDto.paymentMethod),
    });

    await this.feeTransactionRepository.save(transaction);

    // Update student fee record
    studentFee.paidAmount += createDto.amount;
    studentFee.status =
      studentFee.paidAmount >= studentFee.totalAmount ? 'PAID' : 'PARTIAL';

    await this.studentFeeRepository.save(studentFee);

    // Format amount in NPR (lakhs/crores)
    const formattedAmount = NepaliNumberUtil.formatCurrency(
      createDto.amount,
      'en',
    );
    const formattedAmountNp = NepaliNumberUtil.formatCurrency(
      createDto.amount,
      'ne',
    );

    // Generate receipt with Nepal details
    const receipt = {
      transactionId: transaction.transactionId,
      receiptNumber: transaction.receiptNumber, // ✅ Use transaction's receiptNumber
      studentFeeId: studentFee.studentFeeId,
      amount: createDto.amount,
      amountFormatted: formattedAmount,
      amountFormattedNp: formattedAmountNp,
      paymentMethod: createDto.paymentMethod,
      transactionDate: transaction.transactionDate,
      transactionDateBs: NepaliDateUtil.adToBs(transaction.transactionDate)
        .bsDate,
      status: studentFee.status,
      message: this.getPaymentSuccessMessage(createDto.paymentMethod),
    };

    return receipt;
  }

  // Nepal Payment Gateway Integration Methods
  private getPaymentSuccessMessage(gateway: string): string {
    const messages = {
      ESEWA: 'eSewa payment successful. ईसेवा भुक्तानी सफल भयो।',
      KHALTI: 'Khalti payment successful. खल्ती भुक्तानी सफल भयो।',
      FONEPAY: 'FonePay QR payment successful. फोनपे क्यूआर भुक्तानी सफल भयो।',
      CONNECTIPS:
        'ConnectIPS bank transfer successful. कनेक्टआइपीएस बैंक ट्रान्सफर सफल भयो।',
      IMEPAY: 'IME Pay payment successful. आइएमई पे भुक्तानी सफल भयो।',
      CASH: 'Cash payment received. नगद भुक्तानी प्राप्त भयो।',
      BANK: 'Bank transfer received. बैंक ट्रान्सफर प्राप्त भयो।',
      CHEQUE: 'Cheque received. चेक प्राप्त भयो।',
      OTHER: 'Payment received. भुक्तानी प्राप्त भयो।',
    };
    return messages[gateway as keyof typeof messages] || messages.OTHER;
  }

  // Generate Fee Receipt (Nepal Format)
  async generateReceipt(transactionId: number): Promise<any> {
    const transaction = await this.feeTransactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const studentFee = await this.studentFeeRepository.findOne({
      where: { studentFeeId: transaction.studentFeeId },
    });

    if (!studentFee) {
      throw new NotFoundException('Student fee record not found');
    }

    // In production, join with student, school, and category tables
    // For now, return transaction with Nepal formatting
    return {
      receiptNumber: transaction.receiptNumber, // ✅ Correct field
      transactionDate: transaction.transactionDate,
      transactionDateBs: NepaliDateUtil.adToBs(transaction.transactionDate)
        .bsDate,
      amount: transaction.amount,
      amountNpr: NepaliNumberUtil.formatCurrency(transaction.amount, 'en'),
      amountNprNp: NepaliNumberUtil.formatCurrency(transaction.amount, 'ne'),
      paymentMethod: transaction.paymentMethod,
      paymentMethodNp: this.getPaymentMethodNp(transaction.paymentMethod),
      status: studentFee.status,
      remarks: transaction.remarks,
    };
  }

  private getPaymentMethodNp(method: string): string {
    const methods = {
      ESEWA: 'ईसेवा',
      KHALTI: 'खल्ती',
      FONEPAY: 'फोनपे',
      CONNECTIPS: 'कनेक्टआइपीएस',
      IMEPAY: 'आइएमई पे',
      CASH: 'नगद',
      BANK: 'बैंक',
      CHEQUE: 'चेक',
      OTHER: 'अन्य',
    };
    return methods[method as keyof typeof methods] || method;
  }

  // Fee Reminder Service (SMS Integration Ready)
  async getOverdueFees(
    schoolId: number,
    daysOverdue: number = 7,
  ): Promise<StudentFee[]> {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - daysOverdue);

    return this.studentFeeRepository
      .createQueryBuilder('fee')
      .where('fee.status = :status', { status: 'PENDING' })
      .andWhere('fee.dueDate <= :dueDate', { dueDate: overdueDate })
      .andWhere('fee.isActive = true')
      .andWhere('fee.deletedAt IS NULL')
      .getMany();
  }
}
