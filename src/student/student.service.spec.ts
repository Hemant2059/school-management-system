import { Test, TestingModule } from '@nestjs/testing';
import { StudentService, Student } from './student.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { GetStudentsDto } from './dto/get-students.dto';

describe('StudentService', () => {
  let service: StudentService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockStudent: Student = {
    student_id: 1,
    school_id: 1,
    student_code: 'STU-2026-001-0001',
    admission_number: 'ADM-001',
    first_name_en: 'John',
    middle_name_en: null,
    last_name_en: 'Doe',
    first_name_np: 'जोन',
    middle_name_np: null,
    last_name_np: 'डोन',
    display_name: 'John Doe',
    gender: 'male',
    date_of_birth_ad: new Date('2010-01-01'),
    date_of_birth_bs: '2066-01-01',
    dob_bs_snapshot: '2066-01-01',
    student_email: 'john@example.com',
    student_mobile: '9841234567',
    current_status: 'ACTIVE',
    is_active: true,
    is_govt_mandated_free_seat: false,
    is_economically_disadvantaged: false,
    caste_ethnicity_code: 'brahmin',
    caste_ethnicity: 'Brahmin',
    citizenship_number: null,
    birth_certificate_number: null,
    blood_group: 'A+',
    religion: 'Hindu',
    mother_tongue: 'Nepali',
    bank_name: null,
    bank_account_number: null,
    bank_branch: null,
    profile_photo_url: null,
    permanent_province_id: 1,
    permanent_district_id: 1,
    permanent_municipality_id: 1,
    permanent_ward_no: 1,
    permanent_tole_en: 'Maharajgunj',
    permanent_address_en: null,
    permanent_tole_np: 'महाराजगञ्ज',
    permanent_address_np: null,
    created_by: 1,
    updated_by: 1,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<StudentService>(StudentService);
  });

  describe('create', () => {
    const createStudentDto: CreateStudentDto = {
      schoolId: 1,
      admissionNumber: 'ADM-002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      gender: 'female',
      dateOfBirthAd: new Date('2010-01-01'),
    };

    it('should create a new student successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockStudent,
        ...createStudentDto,
      });

      const result = await service.create(createStudentDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['ADM-002', 1],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if admission number already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockStudent);

      await expect(service.create(createStudentDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate unique student code', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '5' }]);
      mockDatabaseService.insert.mockResolvedValue(mockStudent);

      await service.create(createStudentDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const studentCode = insertCall[1][1];
      expect(studentCode).toContain('STU-2026');
      expect(studentCode).toContain('0006');
    });

    it('should set display name from Nepali names if provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockStudent);

      const dtoWithNpNames: CreateStudentDto = {
        ...createStudentDto,
        firstNameNp: 'जेन',
        lastNameNp: 'स्मिथ',
      };

      await service.create(dtoWithNpNames);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const displayName = insertCall[1][11];
      expect(displayName).toBe('जेन स्मिथ');
    });

    it('should set display name from English names if Nepali not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockStudent);

      await service.create(createStudentDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const displayName = insertCall[1][11];
      expect(displayName).toBe('Jane Smith');
    });

    it('should convert AD date to BS if only AD provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockStudent);

      await service.create(createStudentDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if free seat quota exceeded', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '10' }]);

      const dtoWithFreeSeat: CreateStudentDto = {
        ...createStudentDto,
        isGovtMandatedFreeSeat: true,
      };

      await expect(service.create(dtoWithFreeSeat)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow free seat within quota', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockStudent,
        is_govt_mandated_free_seat: true,
      });

      const dtoWithFreeSeat: CreateStudentDto = {
        ...createStudentDto,
        isGovtMandatedFreeSeat: true,
      };

      const result = await service.create(dtoWithFreeSeat);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    const getStudentsDto: GetStudentsDto = {
      schoolId: 1,
      page: 1,
      take: 10,
      order: 'DESC' as any,
    } as unknown as GetStudentsDto;

    it('should return paginated students', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([mockStudent])
        .mockResolvedValueOnce([{ total: '1' }]);

      const result = await service.findAll(1, getStudentsDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
      expect(result.meta.itemCount).toBe(1);
    });

    it('should filter by gender', async () => {
      const dto = {
        ...getStudentsDto,
        gender: 'female',
      } as unknown as GetStudentsDto;
      mockDatabaseService.query
        .mockResolvedValueOnce([mockStudent])
        .mockResolvedValueOnce([{ total: '1' }]);

      await service.findAll(1, dto);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('s.gender'),
        expect.arrayContaining(['female']),
      );
    });

    it('should filter by current status', async () => {
      const dto = {
        ...getStudentsDto,
        currentStatus: 'ACTIVE',
      } as unknown as GetStudentsDto;
      mockDatabaseService.query
        .mockResolvedValueOnce([mockStudent])
        .mockResolvedValueOnce([{ total: '1' }]);

      await service.findAll(1, dto);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('s.current_status'),
        expect.arrayContaining(['ACTIVE']),
      );
    });

    it('should filter by class and section', async () => {
      const dto = {
        ...getStudentsDto,
        classId: 1,
        sectionId: 1,
      } as unknown as GetStudentsDto;
      mockDatabaseService.query
        .mockResolvedValueOnce([mockStudent])
        .mockResolvedValueOnce([{ total: '1' }]);

      await service.findAll(1, dto);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('e.class_id'),
        expect.arrayContaining([1, 1]),
      );
    });

    it('should use default pagination values', async () => {
      const dto = { schoolId: 1 } as unknown as GetStudentsDto;
      mockDatabaseService.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: '0' }]);

      await service.findAll(1, dto);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET'),
        expect.any(Array),
      );
    });
  });

  describe('findOne', () => {
    it('should return student by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockStudent);

      const result = await service.findOne(1);

      expect(result).toEqual(mockStudent);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE student_id = $1'),
        [1],
      );
    });

    it('should throw NotFoundException if student not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByAdmissionNumber', () => {
    it('should return student by admission number', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockStudent);

      const result = await service.findByAdmissionNumber('ADM-001', 1);

      expect(result).toEqual(mockStudent);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE admission_number = $1'),
        ['ADM-001', 1],
      );
    });

    it('should throw NotFoundException if student not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findByAdmissionNumber('INVALID', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateStudentDto = {
      firstNameEn: 'Updated',
      lastNameEn: 'Name',
      gender: 'female',
    };

    it('should update student fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce({ ...mockStudent, ...updateStudentDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, updateStudentDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if student not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, updateStudentDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockStudent);

      await service.update(1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete student', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockStudent);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE students SET is_active = false'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if student not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchStudents', () => {
    it('should search students by name or admission number', async () => {
      mockDatabaseService.query.mockResolvedValue([mockStudent]);

      const result = await service.searchStudents(1, 'John');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(first_name_en) LIKE'),
        [1, '%john%'],
      );
    });

    it('should search in Nepali names too', async () => {
      mockDatabaseService.query.mockResolvedValue([mockStudent]);

      await service.searchStudents(1, 'जोन');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(first_name_np) LIKE'),
        [1, '%जोन%'],
      );
    });

    it('should search by admission number', async () => {
      mockDatabaseService.query.mockResolvedValue([mockStudent]);

      await service.searchStudents(1, 'ADM-001');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('admission_number LIKE'),
        [1, '%adm-001%'],
      );
    });

    it('should limit results to 50', async () => {
      mockDatabaseService.query.mockResolvedValue([mockStudent]);

      await service.searchStudents(1, 'test');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50'),
        expect.any(Array),
      );
    });
  });

  describe('getStudentWithFullDetails', () => {
    it('should return student with details', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockStudent);

      const result = await service.getStudentWithFullDetails(1);

      expect(result).toEqual(mockStudent);
    });
  });
});
