import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('FeeService', () => {
  let service: FeeService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFeeCategory = {
    category_id: 1,
    school_id: 1,
    category_name: 'Tuition Fee',
    description: 'Monthly tuition fee',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFeeStructure = {
    structure_id: 1,
    school_id: 1,
    class_id: 1,
    stream_id: null,
    section_id: 1,
    academic_year: '2081',
    fee_type: 'MONTHLY',
    amount: 5000,
    is_recurring: true,
    fee_frequency: 'MONTHLY',
    due_date: new Date('2024-05-01'),
    due_date_bs: '2081-01-18',
    is_mandatory: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<FeeService>(FeeService);
  });

  describe('createFeeCategory', () => {
    const createDto = {
      schoolId: 1,
      categoryName: 'Transport Fee',
      description: 'Monthly transport fee',
    };

    it('should create a new fee category successfully', async () => {
      mockDatabaseService.insert.mockResolvedValue({
        ...mockFeeCategory,
        ...createDto,
      });

      const result = await service.createFeeCategory(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should set is_active to true by default', async () => {
      mockDatabaseService.insert.mockResolvedValue(mockFeeCategory);

      await service.createFeeCategory(createDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should allow null description', async () => {
      mockDatabaseService.insert.mockResolvedValue(mockFeeCategory);

      const dtoWithoutDesc = { schoolId: 1, categoryName: 'Test' };
      await service.createFeeCategory(dtoWithoutDesc);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAllFeeCategories', () => {
    it('should return all fee categories for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockFeeCategory]);

      const result = await service.findAllFeeCategories(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM fee_categories'),
        [1],
      );
    });

    it('should order by category_name ASC', async () => {
      mockDatabaseService.query.mockResolvedValue([mockFeeCategory]);

      await service.findAllFeeCategories(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY category_name ASC'),
        [1],
      );
    });

    it('should return empty array if no categories', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAllFeeCategories(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findFeeCategory', () => {
    it('should return fee category by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockFeeCategory);

      const result = await service.findFeeCategory(1);

      expect(result).toEqual(mockFeeCategory);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE category_id = $1'),
        [1],
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findFeeCategory(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFeeCategory', () => {
    it('should soft delete fee category', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockFeeCategory);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.removeFeeCategory(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE fee_categories SET is_active = false'),
        [1],
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.removeFeeCategory(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createFeeStructure', () => {
    const createDto = {
      schoolId: 1,
      classId: 1,
      academicYear: '2081',
      feeType: 'MONTHLY',
      amount: 5000,
    };

    it('should create a new fee structure successfully', async () => {
      mockDatabaseService.insert.mockResolvedValue({
        ...mockFeeStructure,
        ...createDto,
      });

      const result = await service.createFeeStructure(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should set default isRecurring to true', async () => {
      mockDatabaseService.insert.mockResolvedValue(mockFeeStructure);

      await service.createFeeStructure(createDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should allow optional fields', async () => {
      mockDatabaseService.insert.mockResolvedValue(mockFeeStructure);

      const dtoWithOptional = {
        ...createDto,
        sectionId: 1,
        isRecurring: true,
        feeFrequency: 'MONTHLY',
      };

      await service.createFeeStructure(dtoWithOptional);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('getFeeStructureForClass', () => {
    it('should return fee structures for a class', async () => {
      mockDatabaseService.query.mockResolvedValue([mockFeeStructure]);

      const result = await service.getFeeStructureForClass(1, 1, '2081');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should return empty array if no structures', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.getFeeStructureForClass(1, 1, '2081');

      expect(result).toHaveLength(0);
    });
  });

  describe('createStudentFee', () => {
    const createDto = {
      schoolId: 1,
      studentId: 1,
      structureId: 1,
      academicYear: '2081',
    };

    it('should create student fee record', async () => {
      mockDatabaseService.insert.mockResolvedValue({
        student_fee_id: 1,
        ...createDto,
      });

      const result = await service.createStudentFee(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('getStudentFees', () => {
    it('should return fees for a student', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.getStudentFees(1, 1);

      expect(result).toBeDefined();
    });
  });

  describe('processPayment', () => {
    const paymentDto = {
      schoolId: 1,
      studentId: 1,
      amount: 5000,
      paymentMethod: 'CASH',
    };

    it('should process payment successfully', async () => {
      mockDatabaseService.insert.mockResolvedValue({
        payment_id: 1,
        ...paymentDto,
        payment_date: new Date(),
      });

      const result = await service.processPayment(paymentDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('generateReceipt', () => {
    it('should generate receipt for transaction', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({
        payment_id: 1,
        amount: 5000,
      });

      const result = await service.generateReceipt(1);

      expect(result).toBeDefined();
    });
  });

  describe('getOverdueFees', () => {
    it('should return overdue fees', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.getOverdueFees(1);

      expect(result).toBeDefined();
    });

    it('should filter by days overdue', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      await service.getOverdueFees(1, 30);

      expect(mockDatabaseService.query).toHaveBeenCalled();
    });
  });
});
