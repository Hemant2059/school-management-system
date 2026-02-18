import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { AcademicClass } from '../academic-class/entities/academic-class.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { BOARD_EXAM_APPLICABLE_CLASS_ORDERS } from '../common/constants/nepal.constants';
import {
  withBsDates,
  withBsDatesArray,
} from '../utils/response-with-bs-dates.util';

const ENROLLMENT_DATE_KEYS = [
  'enrollmentDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(AcademicClass)
    private academicClassRepository: Repository<AcademicClass>,
  ) {}

  async create(
    createDto: CreateEnrollmentDto,
    userId: number = 1,
  ): Promise<Enrollment> {
    // Check if student already has current enrollment
    const currentEnrollment = await this.enrollmentRepository.findOne({
      where: {
        studentId: createDto.studentId,
        schoolId: createDto.schoolId,
        isCurrent: true,
        status: 'ACTIVE',
        deletedAt: IsNull(),
      },
    });

    if (currentEnrollment) {
      throw new BadRequestException(
        `Student already enrolled in class ${currentEnrollment.classId}. ` +
          `Update existing enrollment or mark as PROMOTED/REPEATED first.`,
      );
    }

    if (createDto.boardExamRegistration) {
      await this.assertBoardExamClass(createDto.classId, 'create');
    }

    const enrollment = this.enrollmentRepository.create({
      studentId: createDto.studentId,
      schoolId: createDto.schoolId,
      classId: createDto.classId,
      sectionId: createDto.sectionId,
      academicYear: createDto.academicYear,
      enrollmentDate: createDto.enrollmentDate,
      status: createDto.status ?? 'ACTIVE',
      isCurrent: true,
      rollNumber: createDto.rollNumber,
      boardExamRegistration: createDto.boardExamRegistration,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.enrollmentRepository.save(enrollment);
    return withBsDates(saved, ENROLLMENT_DATE_KEYS);
  }

  async findAll(
    schoolId: number,
    studentId?: number,
    academicYear?: string,
  ): Promise<Enrollment[]> {
    const query = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.schoolId = :schoolId', { schoolId })
      .andWhere('enrollment.deletedAt IS NULL');

    if (studentId) {
      query.andWhere('enrollment.studentId = :studentId', { studentId });
    }

    if (academicYear) {
      query.andWhere('enrollment.academicYear = :academicYear', {
        academicYear,
      });
    }

    query.orderBy('enrollment.enrollmentDate', 'DESC');
    const list = await query.getMany();
    return withBsDatesArray(list, ENROLLMENT_DATE_KEYS);
  }

  async findOne(
    id: number,
    schoolId?: number,
  ): Promise<Enrollment & Record<string, string>> {
    const where: any = {
      enrollmentId: id,
      deletedAt: IsNull(),
    };
    if (schoolId) where.schoolId = schoolId;

    const enrollment = await this.enrollmentRepository.findOne({
      where,
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return withBsDates(enrollment, ENROLLMENT_DATE_KEYS);
  }

  async findByStudent(
    studentId: number,
    schoolId: number,
  ): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      where: {
        studentId,
        schoolId,
        deletedAt: IsNull(),
      },
      order: { enrollmentDate: 'DESC' },
    });
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateEnrollmentDto,
    userId: number = 1,
  ): Promise<Enrollment> {
    const enrollment = await this.findOne(id, schoolId);

    if (updateDto.classId !== undefined) enrollment.classId = updateDto.classId;
    if (updateDto.sectionId !== undefined)
      enrollment.sectionId = updateDto.sectionId;
    if (updateDto.status !== undefined) enrollment.status = updateDto.status;
    if (updateDto.isCurrent !== undefined)
      enrollment.isCurrent = updateDto.isCurrent;
    if (updateDto.rollNumber !== undefined)
      enrollment.rollNumber = updateDto.rollNumber;
    if (updateDto.boardExamRegistration !== undefined) {
      const classId = updateDto.classId ?? enrollment.classId;
      await this.assertBoardExamClass(classId, 'update');
      enrollment.boardExamRegistration = updateDto.boardExamRegistration;
    }

    enrollment.updatedBy = userId;
    const saved = await this.enrollmentRepository.save(enrollment);
    return withBsDates(saved, ENROLLMENT_DATE_KEYS);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.enrollmentRepository.update(id, {
      deletedAt: new Date(),
    });
  }

  // ✅ FIXED: Correct promotion logic
  async promoteStudent(
    enrollmentId: number, // ✅ Enrollment ID (not student ID)
    schoolId: number,
    newClassId: number,
    newSectionId: number,
    academicYear: string,
    userId: number = 1,
  ): Promise<Enrollment> {
    // Get current enrollment by ID
    const currentEnrollment = await this.enrollmentRepository.findOne({
      where: {
        enrollmentId, // ✅ Use enrollmentId to find the specific enrollment
        schoolId,
        isCurrent: true,
        deletedAt: IsNull(),
      },
    });

    if (!currentEnrollment) {
      throw new BadRequestException(
        'No current enrollment found for promotion',
      );
    }

    // Mark current enrollment as PROMOTED
    await this.enrollmentRepository.update(currentEnrollment.enrollmentId, {
      status: 'PROMOTED',
      isCurrent: false,
      updatedBy: userId,
    });

    // ✅ Create new enrollment with ALL required fields
    const newEnrollment = this.enrollmentRepository.create({
      studentId: currentEnrollment.studentId, // ✅ Carry forward student ID
      schoolId, // ✅ Set school ID
      classId: newClassId, // ✅ Required field
      sectionId: newSectionId, // ✅ Required field
      academicYear,
      enrollmentDate: new Date(),
      status: 'ACTIVE',
      isCurrent: true,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.enrollmentRepository.save(newEnrollment);
  }

  /**
   * Board exam registration (SEE/NEB) is only applicable for classes 8–12.
   * Throws if classId does not refer to one of those class orders.
   */
  private async assertBoardExamClass(
    classId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _action: 'create' | 'update',
  ): Promise<void> {
    const academicClass = await this.academicClassRepository.findOne({
      where: { classId },
    });
    if (!academicClass) {
      throw new BadRequestException(`Class with ID ${classId} not found`);
    }
    const applicable = (
      BOARD_EXAM_APPLICABLE_CLASS_ORDERS as readonly number[]
    ).includes(academicClass.classOrder);
    if (!applicable) {
      throw new BadRequestException(
        `Board exam registration (SEE/NEB) is only applicable for classes 8, 9, 10, 11, 12. ` +
          `This enrollment is for class order ${academicClass.classOrder} (${academicClass.className}).`,
      );
    }
  }

  async getCurrentEnrollmentWithDetails(
    enrollmentId: number,
    schoolId: number,
  ): Promise<any> {
    const enrollment = await this.findOne(enrollmentId, schoolId);

    const [startYear] = enrollment.academicYear.split('-');
    const nepaliYear = parseInt(startYear, 10);

    return {
      ...enrollment,
      nepaliAcademicYear: `${nepaliYear}–${nepaliYear + 1}`,
      enrollmentDateBs:
        enrollment.enrollmentDateBs ??
        NepaliDateUtil.adToBs(enrollment.enrollmentDate).bsDate,
    };
  }
}
