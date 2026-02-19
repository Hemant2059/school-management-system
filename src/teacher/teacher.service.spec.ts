import { Test, TestingModule } from '@nestjs/testing';
import { TeacherService, Teacher } from './teacher.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';

describe('TeacherService', () => {
  let service: TeacherService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTeacher: Teacher = {
    teacher_id: 1,
    school_id: 1,
    teacher_code: 'TCH-26-00001',
    employee_id: 'EMP-001',
    first_name_en: 'John',
    middle_name_en: null,
    last_name_en: 'Doe',
    first_name_np: 'जोन',
    middle_name_np: null,
    last_name_np: 'डोन',
    display_name: 'John Doe',
    date_of_birth: new Date('1985-01-01'),
    date_of_birth_bs: '2041-01-01',
    gender: 'male',
    blood_group: 'A+',
    nationality: 'Nepalese',
    religion: 'Hindu',
    highest_qualification: 'Masters',
    specialization: 'Mathematics',
    university_board: 'TU',
    passing_year: 2010,
    teaching_license_number: 'TL-12345',
    license_expiry_date: new Date('2030-01-01'),
    personal_mobile: '9841234567',
    official_mobile: '01-123456',
    personal_email: 'john@example.com',
    official_email: 'john@school.edu.np',
    joining_date: new Date('2020-01-01'),
    joining_date_bs: '2076-01-01',
    employment_type: 'PERMANENT',
    department: 'Science',
    designation: 'Teacher',
    current_status: 'ACTIVE',
    is_active: true,
    citizenship_number: '123-456-789',
    citizenship_issue_district: 'Kathmandu',
    citizenship_issue_date: new Date('2010-01-01'),
    citizenship_issue_date_bs: '2066-01-01',
    pan_number: '123456789',
    ssf_number: 'SSF-123',
    bank_name: 'NMB',
    bank_account_number: '1234567890',
    bank_branch: 'Main Branch',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '9841234568',
    emergency_contact_relation: 'Spouse',
    caste_ethnicity_code: 'brahmin',
    caste_ethnicity_name: 'Brahmin',
    marital_status: 'Married',
    profile_photo_url: null,
    permanent_province_id: 1,
    permanent_district_id: 1,
    permanent_municipality_id: 1,
    permanent_ward_no: 1,
    permanent_tole_en: 'Maharajgunj',
    permanent_address_en: null,
    permanent_tole_np: 'महाराजगञ्ज',
    permanent_address_np: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<TeacherService>(TeacherService);
  });

  describe('create', () => {
    const createTeacherDto: CreateTeacherDto = {
      schoolId: 1,
      employeeId: 'EMP-002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      gender: 'female',
      personalMobile: '9841234567',
      joiningDate: new Date('2020-01-01'),
    };

    it('should create a new teacher successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockTeacher,
        ...createTeacherDto,
      });

      const result = await service.create(createTeacherDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['EMP-002', 1],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if employee ID already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockTeacher);

      await expect(service.create(createTeacherDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate unique teacher code', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '5' }]);
      mockDatabaseService.insert.mockResolvedValue(mockTeacher);

      await service.create(createTeacherDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const teacherCode = insertCall[1][1];
      expect(teacherCode).toContain('TCH-26');
      expect(teacherCode).toContain('00006');
    });

    it('should set display name from Nepali names if provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockTeacher);

      const dtoWithNpNames: CreateTeacherDto = {
        ...createTeacherDto,
        firstNameNp: 'जेन',
        lastNameNp: 'स्मिथ',
      };

      await service.create(dtoWithNpNames);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const displayName = insertCall[1][9];
      expect(displayName).toBe('जेन स्मिथ');
    });

    it('should set display name from English names if Nepali not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);
      mockDatabaseService.insert.mockResolvedValue(mockTeacher);

      await service.create(createTeacherDto);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      const displayName = insertCall[1][9];
      expect(displayName).toBe('Jane Smith');
    });

    it('should default employment type to PERMANENT when not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);

      const dtoWithoutEmploymentType: CreateTeacherDto = {
        schoolId: 1,
        employeeId: 'EMP-003',
        firstNameEn: 'Test',
        lastNameEn: 'Teacher',
        gender: 'male',
        joiningDate: new Date('2020-01-01'),
      };

      mockDatabaseService.insert.mockResolvedValue({
        ...mockTeacher,
        employment_type: 'PERMANENT',
      });

      await service.create(dtoWithoutEmploymentType);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should default current status to ACTIVE when not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ count: '0' }]);

      const dtoWithoutStatus: CreateTeacherDto = {
        schoolId: 1,
        employeeId: 'EMP-004',
        firstNameEn: 'Test',
        lastNameEn: 'Teacher2',
        gender: 'male',
        joiningDate: new Date('2020-01-01'),
      };

      mockDatabaseService.insert.mockResolvedValue({
        ...mockTeacher,
        current_status: 'ACTIVE',
      });

      await service.create(dtoWithoutStatus);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const pageOptionsDto: PageOptionsDto = {
      page: 1,
      take: 10,
      order: 'DESC' as any,
      skip: 0,
    } as unknown as PageOptionsDto;

    it('should return paginated teachers', async () => {
      mockDatabaseService.query
        .mockResolvedValueOnce([mockTeacher])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await service.findAll(1, pageOptionsDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
      expect(result.meta.itemCount).toBe(1);
    });

    it('should use default pagination values', async () => {
      const defaultPageOptions: PageOptionsDto = {
        order: 'DESC' as any,
        skip: 0,
      } as unknown as PageOptionsDto;
      mockDatabaseService.query
        .mockResolvedValueOnce([mockTeacher])
        .mockResolvedValueOnce([{ count: '0' }]);

      await service.findAll(1, defaultPageOptions);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [1, 10, 0],
      );
    });

    it('should respect order parameter', async () => {
      const ascOptions: PageOptionsDto = {
        page: 1,
        take: 10,
        order: 'ASC' as any,
        skip: 0,
      } as unknown as PageOptionsDto;
      mockDatabaseService.query
        .mockResolvedValueOnce([mockTeacher])
        .mockResolvedValueOnce([{ count: '1' }]);

      await service.findAll(1, ascOptions);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at ASC'),
        [1, 10, 0],
      );
    });
  });

  describe('findOne', () => {
    it('should return teacher by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockTeacher);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTeacher);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE teacher_id = $1'),
        [1],
      );
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmployeeId', () => {
    it('should return teacher by employee ID', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockTeacher);

      const result = await service.findByEmployeeId('EMP-001');

      expect(result).toEqual(mockTeacher);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE employee_id = $1'),
        ['EMP-001'],
      );
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findByEmployeeId('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateTeacherDto: UpdateTeacherDto = {
      firstNameEn: 'Updated',
      lastNameEn: 'Name',
      personalMobile: '9876543210',
    };

    it('should update teacher fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockTeacher)
        .mockResolvedValueOnce({ ...mockTeacher, ...updateTeacherDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, updateTeacherDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, updateTeacherDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockTeacher)
        .mockResolvedValueOnce(mockTeacher);

      await service.update(1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete teacher', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockTeacher);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE teachers SET is_active = false'),
        [1],
      );
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchTeachers', () => {
    it('should search teachers by name or employee ID', async () => {
      mockDatabaseService.query.mockResolvedValue([mockTeacher]);

      const result = await service.searchTeachers(1, 'John');

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(first_name_en) LIKE'),
        [1, '%john%'],
      );
    });

    it('should search in Nepali names too', async () => {
      mockDatabaseService.query.mockResolvedValue([mockTeacher]);

      await service.searchTeachers(1, 'जोन');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(first_name_np) LIKE'),
        [1, '%जोन%'],
      );
    });

    it('should search by employee ID', async () => {
      mockDatabaseService.query.mockResolvedValue([mockTeacher]);

      await service.searchTeachers(1, 'EMP-001');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('employee_id LIKE'),
        [1, '%emp-001%'],
      );
    });

    it('should limit results to 50', async () => {
      mockDatabaseService.query.mockResolvedValue([mockTeacher]);

      await service.searchTeachers(1, 'test');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50'),
        expect.any(Array),
      );
    });
  });

  describe('getTeacherWithDetails', () => {
    it('should return teacher with details', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockTeacher);

      const result = await service.getTeacherWithDetails(1);

      expect(result).toEqual(mockTeacher);
    });
  });
});
