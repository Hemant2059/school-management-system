import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like } from 'typeorm'; // ✅ Import Like operator
import { Staff } from './entities/staff.entity';
import { Payroll } from './entities/payroll.entity';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    @InjectRepository(LeaveType)
    private leaveTypeRepository: Repository<LeaveType>,
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  // Staff Management
  async createStaff(createDto: CreateStaffDto): Promise<Staff> {
    const existing = await this.staffRepository.findOne({
      where: {
        userId: createDto.userId,
        schoolId: createDto.schoolId,
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Staff record already exists for this user',
      );
    }

    // Convert dates to BS (handle null cases)
    const dobBs = createDto.dateOfBirth
      ? NepaliDateUtil.adToBs(createDto.dateOfBirth).bsDate
      : null;
    const hireBs = NepaliDateUtil.adToBs(createDto.hireDate).bsDate;

    // ✅ FIXED: Create entity with explicit property mapping
    const staff = this.staffRepository.create({
      schoolId: createDto.schoolId,
      userId: createDto.userId,
      firstNameEn: createDto.firstNameEn,
      middleNameEn: createDto.middleNameEn,
      lastNameEn: createDto.lastNameEn,
      firstNameNp: createDto.firstNameNp,
      middleNameNp: createDto.middleNameNp,
      lastNameNp: createDto.lastNameNp,
      citizenshipNumber: createDto.citizenshipNumber,
      panNumber: createDto.panNumber,
      dateOfBirth: createDto.dateOfBirth,
      dateOfBirthBs: dobBs, // ✅ Now accepts null
      gender: createDto.gender,
      position: createDto.position,
      department: createDto.department,
      hireDate: createDto.hireDate,
      hireDateBs: hireBs, // ✅ Now accepts null
      employmentType: createDto.employmentType,
      mobile: createDto.mobile,
      email: createDto.email,
      provinceId: createDto.provinceId,
      districtId: createDto.districtId,
      municipalityId: createDto.municipalityId,
      wardNo: createDto.wardNo,
      toleEn: createDto.toleEn,
      toleNp: createDto.toleNp,
      isActive: true,
    });

    return this.staffRepository.save(staff); // ✅ Returns single Staff
  }

  async findAllStaff(schoolId: number): Promise<Staff[]> {
    return this.staffRepository.find({
      where: { schoolId, isActive: true, deletedAt: IsNull() },
    });
  }

  async findOneStaff(id: number, schoolId?: number): Promise<Staff> {
    const where: any = { staffId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const staff = await this.staffRepository.findOne({
      where,
    });
    if (!staff) throw new NotFoundException(`Staff with ID ${id} not found`);
    return staff;
  }

  // Nepal Tax Calculation Engine (2081/82 Rules)
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

  // Process Payroll with Nepal Compliance
  async processPayroll(processDto: ProcessPayrollDto): Promise<Payroll> {
    const existing = await this.payrollRepository.findOne({
      where: {
        staffId: processDto.staffId,
        schoolId: processDto.schoolId,
        salaryMonthBs: processDto.salaryMonthBs,
      },
    });
    if (existing) {
      throw new BadRequestException('Payroll already processed for this month');
    }

    const staff = await this.findOneStaff(
      processDto.staffId,
      processDto.schoolId,
    );

    // Calculate allowances (defaults if not provided)
    const houseRent =
      processDto.houseRentAllowance || processDto.basicSalary * 0.4;
    const transport =
      processDto.transportAllowance || processDto.basicSalary * 0.15;
    const medical = processDto.medicalAllowance || processDto.basicSalary * 0.1;

    // ✅ FIXED: Use optional chaining for missing properties
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
      processDto.panNumber || staff.panNumber,
    );
    const monthlyTax = annualTax / 12;

    // ✅ FIXED: Use optional chaining for missing properties
    const totalDeductions =
      citDeduction +
      providentFund +
      ssfEmployee +
      monthlyTax +
      (processDto.otherDeductions || 0);

    const netSalary = grossSalary - totalDeductions;

    const paymentDate = new Date();
    const paymentDateBs = NepaliDateUtil.adToBs(paymentDate).bsDate;

    // ✅ FIXED: Create payroll with explicit property mapping
    const payroll = this.payrollRepository.create({
      schoolId: processDto.schoolId,
      staffId: processDto.staffId,
      salaryMonthBs: processDto.salaryMonthBs,
      paymentDate,
      paymentDateBs,
      basicSalary: processDto.basicSalary,
      houseRentAllowance: houseRent,
      transportAllowance: transport,
      medicalAllowance: medical,
      otherAllowances: processDto.otherAllowances || 0, // ✅ Added
      grossSalary,
      citDeduction,
      ssfEmployeeContribution: ssfEmployee,
      ssfEmployerContribution: ssfEmployer,
      providentFund,
      taxDeduction: monthlyTax,
      otherDeductions: processDto.otherDeductions || 0, // ✅ Added
      totalDeductions,
      netSalary,
      panNumber: processDto.panNumber || staff.panNumber,
      isTaxExempt: processDto.isTaxExempt || false,
      isPaid: true,
    });

    return this.payrollRepository.save(payroll);
  }

  async getStaffPayroll(
    staffId: number,
    schoolId: number,
    year?: string,
  ): Promise<Payroll[]> {
    const where: any = { staffId, schoolId };
    if (year) {
      // ✅ FIXED: Use Like operator correctly
      where.salaryMonthBs = Like(`${year}-%`);
    }
    return this.payrollRepository.find({
      where,
      order: { paymentDate: 'DESC' },
    });
  }

  // Leave Management
  async createLeaveRequest(
    createDto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    if (createDto.endDate < createDto.startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const startBs = NepaliDateUtil.adToBs(createDto.startDate).bsDate;
    const endBs = NepaliDateUtil.adToBs(createDto.endDate).bsDate;

    const leaveRequest = this.leaveRequestRepository.create({
      schoolId: createDto.schoolId,
      staffId: createDto.staffId,
      leaveTypeId: createDto.leaveTypeId,
      startDate: createDto.startDate,
      startDateBs: startBs,
      endDate: createDto.endDate,
      endDateBs: endBs,
      daysRequested: createDto.daysRequested,
      reason: createDto.reason,
      status: 'PENDING',
      isActive: true,
    });

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async approveLeaveRequest(
    leaveRequestId: number,
    approvedBy: number,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { leaveRequestId },
    });
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Leave request is not pending');
    }

    leaveRequest.status = 'APPROVED';
    leaveRequest.approvedBy = approvedBy;
    return this.leaveRequestRepository.save(leaveRequest);
  }

  async rejectLeaveRequest(
    leaveRequestId: number,
    rejectionReason: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { leaveRequestId },
    });
    if (!leaveRequest) throw new NotFoundException('Leave request not found');
    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Leave request is not pending');
    }

    leaveRequest.status = 'REJECTED';
    leaveRequest.rejectionReason = rejectionReason;
    return this.leaveRequestRepository.save(leaveRequest);
  }

  // Nepal Holiday Calendar
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

  // Generate Payslip with NPR Formatting
  async generatePayslip(payrollId: number): Promise<any> {
    const payroll = await this.payrollRepository.findOne({
      where: { payrollId },
    });
    if (!payroll) throw new NotFoundException('Payroll record not found');

    const staff = await this.findOneStaff(payroll.staffId);

    return {
      payrollId,
      staffName: staff.getFullName('en'),
      staffNameNp: staff.getFullName('np'),
      position: staff.position,
      salaryMonth: payroll.salaryMonthBs,
      paymentDate: payroll.paymentDate,
      paymentDateBs: payroll.paymentDateBs,
      earnings: {
        basicSalary: NepaliNumberUtil.formatCurrency(payroll.basicSalary, 'en'),
        houseRentAllowance: NepaliNumberUtil.formatCurrency(
          payroll.houseRentAllowance,
          'en',
        ),
        transportAllowance: NepaliNumberUtil.formatCurrency(
          payroll.transportAllowance,
          'en',
        ),
        medicalAllowance: NepaliNumberUtil.formatCurrency(
          payroll.medicalAllowance,
          'en',
        ),
        grossSalary: NepaliNumberUtil.formatCurrency(payroll.grossSalary, 'en'),
      },
      deductions: {
        citDeduction: NepaliNumberUtil.formatCurrency(
          payroll.citDeduction,
          'en',
        ),
        ssfEmployeeContribution: NepaliNumberUtil.formatCurrency(
          payroll.ssfEmployeeContribution,
          'en',
        ),
        providentFund: NepaliNumberUtil.formatCurrency(
          payroll.providentFund,
          'en',
        ),
        taxDeduction: NepaliNumberUtil.formatCurrency(
          payroll.taxDeduction,
          'en',
        ),
        totalDeductions: NepaliNumberUtil.formatCurrency(
          payroll.totalDeductions,
          'en',
        ),
      },
      netSalary: NepaliNumberUtil.formatCurrency(payroll.netSalary, 'en'),
      netSalaryNp: NepaliNumberUtil.formatCurrency(payroll.netSalary, 'ne'),
      panNumber: payroll.panNumber,
      remarks: payroll.remarks,
    };
  }
}
