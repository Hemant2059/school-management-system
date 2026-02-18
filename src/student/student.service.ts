import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { GOVT_FREE_SEAT_QUOTA_PERCENT } from '../common/constants/nepal.constants';
import {
  withBsDates,
  withBsDatesArray,
} from '../utils/response-with-bs-dates.util';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import { GetStudentsDto } from './dto/get-students.dto';

const STUDENT_DATE_KEYS = [
  'dateOfBirthAd',
  'admissionDate',
  'tcIssueDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

import { DataSource } from 'typeorm';

@Injectable()
export class StudentService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
    userId: number = 1,
  ): Promise<Student> {
    const existing = await this.studentRepository.findOne({
      where: {
        admissionNumber: createStudentDto.admissionNumber,
        schoolId: createStudentDto.schoolId,
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Student with this admission number already exists in this school',
      );
    }

    if (createStudentDto.isGovtMandatedFreeSeat) {
      const [total, freeSeatCount] = await Promise.all([
        this.studentRepository.count({
          where: {
            schoolId: createStudentDto.schoolId,
            isActive: true,
            currentStatus: 'ACTIVE',
          },
        }),
        this.studentRepository.count({
          where: {
            schoolId: createStudentDto.schoolId,
            isActive: true,
            currentStatus: 'ACTIVE',
            isGovtMandatedFreeSeat: true,
          },
        }),
      ]);
      const newTotal = total + 1;
      const newFreeCount = freeSeatCount + 1;
      const maxAllowed = Math.floor(
        (newTotal * GOVT_FREE_SEAT_QUOTA_PERCENT) / 100,
      );
      if (newFreeCount > maxAllowed) {
        throw new BadRequestException(
          `Government-mandated free seats cannot exceed ${GOVT_FREE_SEAT_QUOTA_PERCENT}% of total students. ` +
            `Current: ${freeSeatCount} free / ${total} total; max allowed for ${newTotal} students is ${maxAllowed}.`,
        );
      }
    }

    const schoolIdStr = String(createStudentDto.schoolId).padStart(3, '0');
    const count = await this.studentRepository.count({
      where: { schoolId: createStudentDto.schoolId },
    });
    const yearSuffix = new Date().getFullYear().toString();
    const studentCode = `STU-${yearSuffix}-${schoolIdStr}-${String(count + 1).padStart(4, '0')}`;

    let dateOfBirthBs = createStudentDto.dateOfBirthBs;
    if (!dateOfBirthBs && createStudentDto.dateOfBirthAd) {
      dateOfBirthBs = NepaliDateUtil.adToBs(
        createStudentDto.dateOfBirthAd,
      ).bsDate;
    }
    if (dateOfBirthBs && createStudentDto.dateOfBirthAd) {
      if (!NepaliDateUtil.isValidBsDate(dateOfBirthBs)) {
        throw new BadRequestException(
          'Invalid BS date of birth (use valid YYYY-MM-DD)',
        );
      }
      const adFromBs = NepaliDateUtil.bsToAd(dateOfBirthBs);
      const ad = new Date(createStudentDto.dateOfBirthAd);
      if (
        ad.getFullYear() !== adFromBs.getFullYear() ||
        ad.getMonth() !== adFromBs.getMonth() ||
        ad.getDate() !== adFromBs.getDate()
      ) {
        throw new BadRequestException(
          'BS date of birth does not match AD date of birth',
        );
      }
    }

    // ✅ Compute displayName directly (don't use DTO property)
    const displayName = createStudentDto.firstNameNp
      ? `${createStudentDto.firstNameNp} ${createStudentDto.lastNameNp || ''}`.trim()
      : `${createStudentDto.firstNameEn} ${createStudentDto.lastNameEn || ''}`.trim();

    const student = this.studentRepository.create({
      ...createStudentDto,
      studentCode,
      dateOfBirthBs,
      displayName, // ✅ Set directly
      currentStatus: createStudentDto.currentStatus || 'ACTIVE',
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.studentRepository.save(student);
    return withBsDates(saved, STUDENT_DATE_KEYS);
  }

  async findAll(
    schoolId: number,
    getStudentsDto: GetStudentsDto,
  ): Promise<PageDto<Student>> {
    const params: any[] = [schoolId];
    let query = `
      SELECT s.*, 
             e.class_id, e.section_id, e.roll_number, e.academic_year
      FROM students s
      LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.school_id = s.school_id
      WHERE s.school_id = $1 AND s.is_active = true
    `;

    // Dynamic Filter Construction
    if (getStudentsDto.gender) {
      params.push(getStudentsDto.gender);
      query += ` AND s.gender = $${params.length}`;
    }

    if (getStudentsDto.currentStatus) {
      params.push(getStudentsDto.currentStatus);
      query += ` AND s.current_status = $${params.length}`;
    }

    // Enrollment Filters
    if (getStudentsDto.academicYear) {
      params.push(getStudentsDto.academicYear);
      query += ` AND e.academic_year = $${params.length}`;
    } else {
      // If no academic year specified, usually we want current enrollment
      // But let's check if class/section is filtered
      if (getStudentsDto.classId || getStudentsDto.sectionId) {
        query += ` AND e.is_current = true`;
      }
    }

    if (getStudentsDto.classId) {
      params.push(getStudentsDto.classId);
      query += ` AND e.class_id = $${params.length}`;
    }

    if (getStudentsDto.sectionId) {
      params.push(getStudentsDto.sectionId);
      query += ` AND e.section_id = $${params.length}`;
    }

    // Sorting - prevent SQL injection by hardcoding safe column
    const sortColumn = 's.created_at'; // Default
    const sortOrder = String(getStudentsDto.order) === 'ASC' ? 'ASC' : 'DESC';

    // Pagination
    query += ` ORDER BY ${sortColumn} ${sortOrder} OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(getStudentsDto.skip, getStudentsDto.take);

    // Count Query
    // We need a separate count query for pagination metadata
    // Optimizing by removing ORDER BY and LIMIT/OFFSET for count
    // And selecting COUNT(*)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.school_id = s.school_id
      WHERE s.school_id = $1 AND s.is_active = true
    `;
    // Re-apply filters to count query (reusing params logic would be cleaner but let's duplicate for now for safety)
    const countParams: any[] = [schoolId];
    if (getStudentsDto.gender) {
      countParams.push(getStudentsDto.gender);
      countQuery += ` AND s.gender = $${countParams.length}`;
    }
    if (getStudentsDto.currentStatus) {
      countParams.push(getStudentsDto.currentStatus);
      countQuery += ` AND s.current_status = $${countParams.length}`;
    }
    if (getStudentsDto.academicYear) {
      countParams.push(getStudentsDto.academicYear);
      countQuery += ` AND e.academic_year = $${countParams.length}`;
    } else if (getStudentsDto.classId || getStudentsDto.sectionId) {
      countQuery += ` AND e.is_current = true`;
    }
    if (getStudentsDto.classId) {
      countParams.push(getStudentsDto.classId);
      countQuery += ` AND e.class_id = $${countParams.length}`;
    }
    if (getStudentsDto.sectionId) {
      countParams.push(getStudentsDto.sectionId);
      countQuery += ` AND e.section_id = $${countParams.length}`;
    }

    const [entities, countResult] = await Promise.all([
      this.dataSource.query(query, params),
      this.dataSource.query(countQuery, countParams),
    ]);

    const itemCount = parseInt(countResult[0].total);

    // Map raw results to entities (camelCase)
    const mappedEntities = entities.map((row) => this.mapRowToStudent(row));

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: getStudentsDto,
    });

    return new PageDto(
      withBsDatesArray(mappedEntities, STUDENT_DATE_KEYS),
      pageMetaDto,
    );
  }

  // Helper for snake_case to CamelCase mapping
  private mapRowToStudent(row: any): Student {
    const student = new Student();
    student.studentId = row.student_id;
    student.schoolId = row.school_id;
    student.studentCode = row.student_code;
    student.admissionNumber = row.admission_number;
    student.firstNameEn = row.first_name_en;
    student.middleNameEn = row.middle_name_en;
    student.lastNameEn = row.last_name_en;
    student.firstNameNp = row.first_name_np;
    student.middleNameNp = row.middle_name_np;
    student.lastNameNp = row.last_name_np;
    student.gender = row.gender;
    student.dateOfBirthAd = row.date_of_birth_ad;
    student.dateOfBirthBs = row.date_of_birth_bs;
    student.studentEmail = row.student_email;
    student.studentMobile = row.student_mobile;
    student.currentStatus = row.current_status;
    student.isActive = row.is_active;
    student.createdAt = row.created_at;
    student.updatedAt = row.updated_at;
    return student;
  }

  async findOne(id: number): Promise<Student & Record<string, string>> {
    const student = await this.studentRepository.findOne({
      where: { studentId: id, isActive: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return withBsDates(student, STUDENT_DATE_KEYS);
  }

  async findByAdmissionNumber(
    admissionNumber: string,
    schoolId: number,
  ): Promise<Student & Record<string, string>> {
    const student = await this.studentRepository.findOne({
      where: { admissionNumber, schoolId, isActive: true },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with admission number ${admissionNumber} not found`,
      );
    }

    return withBsDates(student, STUDENT_DATE_KEYS);
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    userId: number = 1,
  ): Promise<Student> {
    const student = await this.findOne(id);

    if (
      updateStudentDto.isGovtMandatedFreeSeat === true &&
      !student.isGovtMandatedFreeSeat
    ) {
      const [total, freeSeatCount] = await Promise.all([
        this.studentRepository.count({
          where: {
            schoolId: student.schoolId,
            isActive: true,
            currentStatus: 'ACTIVE',
          },
        }),
        this.studentRepository.count({
          where: {
            schoolId: student.schoolId,
            isActive: true,
            currentStatus: 'ACTIVE',
            isGovtMandatedFreeSeat: true,
          },
        }),
      ]);
      const newFreeCount = freeSeatCount + 1;
      const maxAllowed = Math.floor(
        (total * GOVT_FREE_SEAT_QUOTA_PERCENT) / 100,
      );
      if (newFreeCount > maxAllowed) {
        throw new BadRequestException(
          `Government-mandated free seats cannot exceed ${GOVT_FREE_SEAT_QUOTA_PERCENT}% of total students. ` +
            `Max allowed: ${maxAllowed} for ${total} students.`,
        );
      }
    }

    // Update BS date if AD date changed
    if (updateStudentDto.dateOfBirthAd && !updateStudentDto.dateOfBirthBs) {
      updateStudentDto.dateOfBirthBs = NepaliDateUtil.adToBs(
        updateStudentDto.dateOfBirthAd,
      ).bsDate;
    }

    // ✅ Merge DTO into student entity FIRST
    Object.assign(student, updateStudentDto);

    // ✅ THEN recalculate displayName from current entity state
    student.displayName = student.firstNameNp
      ? `${student.firstNameNp} ${student.lastNameNp || ''}`.trim()
      : `${student.firstNameEn} ${student.lastNameEn || ''}`.trim();

    student.updatedBy = userId;

    const saved = await this.studentRepository.save(student);
    return withBsDates(saved, STUDENT_DATE_KEYS);
  }

  async remove(id: number, userId: number = 1): Promise<void> {
    await this.findOne(id);

    await this.studentRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  async getStudentWithFullDetails(id: number): Promise<any> {
    const student = await this.findOne(id);

    const nepaliDob = student.dateOfBirthBs
      ? NepaliDateUtil.formatBsDate(
          student.dateOfBirthBs,
          'ddd DD, MMMM YYYY',
          'np',
        )
      : null;

    const englishDob = student.dateOfBirthAd
      ? new Date(student.dateOfBirthAd).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    return {
      ...student,
      nepaliDob,
      englishDob,
      fullName: {
        en: student.getFullName('en'),
        np: student.getFullName('np') || student.getFullName('en'),
      },
    };
  }

  async searchStudents(
    schoolId: number,
    query: string,
  ): Promise<(Student & Record<string, string>)[]> {
    const normalizedQuery = query.normalize('NFC').toLowerCase();

    const list = await this.studentRepository
      .createQueryBuilder('student')
      .where('student.schoolId = :schoolId', { schoolId })
      .andWhere('student.isActive = true')
      .andWhere(
        `(LOWER(student.firstNameEn) LIKE :search OR
          LOWER(student.lastNameEn) LIKE :search OR
          LOWER(student.firstNameNp) LIKE :search OR
          LOWER(student.lastNameNp) LIKE :search OR
          student.admissionNumber LIKE :search OR
          student.rollNumber LIKE :search)`,
        { search: `%${normalizedQuery}%` },
      )
      .orderBy('student.createdAt', 'DESC')
      .getMany();
    return withBsDatesArray(list, STUDENT_DATE_KEYS);
  }
}
