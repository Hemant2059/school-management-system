import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    // Check if teacher with same employee ID exists
    const existing = await this.teacherRepository.findOne({
      where: {
        employeeId: createTeacherDto.employeeId,
        schoolId: createTeacherDto.schoolId,
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Teacher with this employee ID already exists',
      );
    }

    const count = await this.teacherRepository.count({
      where: { schoolId: createTeacherDto.schoolId },
    });
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const teacherCode = `TCH-${yearSuffix}-${String(count + 1).padStart(5, '0')}`;

    // Safe displayName computation
    const displayName = createTeacherDto.firstNameNp
      ? `${createTeacherDto.firstNameNp} ${createTeacherDto.lastNameNp ?? ''}`.trim()
      : `${createTeacherDto.firstNameEn} ${createTeacherDto.lastNameEn ?? ''}`.trim();

    // Explicit property mapping
    const teacher = this.teacherRepository.create({
      teacherCode,
      schoolId: createTeacherDto.schoolId,
      employeeId: createTeacherDto.employeeId,
      firstNameEn: createTeacherDto.firstNameEn,
      middleNameEn: createTeacherDto.middleNameEn,
      lastNameEn: createTeacherDto.lastNameEn,
      firstNameNp: createTeacherDto.firstNameNp,
      middleNameNp: createTeacherDto.middleNameNp,
      lastNameNp: createTeacherDto.lastNameNp,
      displayName,
      dateOfBirth: createTeacherDto.dateOfBirth,
      gender: createTeacherDto.gender,
      bloodGroup: createTeacherDto.bloodGroup,
      nationality: createTeacherDto.nationality,
      religion: createTeacherDto.religion,
      highestQualification: createTeacherDto.highestQualification,
      specialization: createTeacherDto.specialization,
      universityBoard: createTeacherDto.universityBoard,
      passingYear: createTeacherDto.passingYear,
      teachingLicenseNumber: createTeacherDto.teachingLicenseNumber,
      licenseExpiryDate: createTeacherDto.licenseExpiryDate,
      personalMobile: createTeacherDto.personalMobile,
      officialMobile: createTeacherDto.officialMobile,
      personalEmail: createTeacherDto.personalEmail,
      officialEmail: createTeacherDto.officialEmail,
      joiningDate: createTeacherDto.joiningDate,
      employmentType: createTeacherDto.employmentType,
      department: createTeacherDto.department,
      currentStatus: createTeacherDto.currentStatus ?? 'ACTIVE',
      isActive: true,
    });

    return this.teacherRepository.save(teacher);
  }

  async findAll(
    schoolId: number,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Teacher>> {
    const queryBuilder = this.teacherRepository.createQueryBuilder('teacher');

    queryBuilder
      .where('teacher.schoolId = :schoolId', { schoolId })
      .andWhere('teacher.isActive = true')
      .orderBy('teacher.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: number): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { teacherId: id, isActive: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async findByEmployeeId(employeeId: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { employeeId, isActive: true },
    });

    if (!teacher) {
      throw new NotFoundException(
        `Teacher with employee ID ${employeeId} not found`,
      );
    }

    return teacher;
  }

  async update(
    id: number,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<Teacher> {
    const teacher = await this.findOne(id);

    // Safe partial update with explicit checks
    if (updateTeacherDto.firstNameEn !== undefined)
      teacher.firstNameEn = updateTeacherDto.firstNameEn;
    if (updateTeacherDto.lastNameEn !== undefined)
      teacher.lastNameEn = updateTeacherDto.lastNameEn;
    if (updateTeacherDto.firstNameNp !== undefined)
      teacher.firstNameNp = updateTeacherDto.firstNameNp;
    if (updateTeacherDto.lastNameNp !== undefined)
      teacher.lastNameNp = updateTeacherDto.lastNameNp;
    if (updateTeacherDto.gender !== undefined)
      teacher.gender = updateTeacherDto.gender;
    if (updateTeacherDto.personalMobile !== undefined)
      teacher.personalMobile = updateTeacherDto.personalMobile;
    if (updateTeacherDto.officialMobile !== undefined)
      teacher.officialMobile = updateTeacherDto.officialMobile;
    if (updateTeacherDto.personalEmail !== undefined)
      teacher.personalEmail = updateTeacherDto.personalEmail;
    if (updateTeacherDto.officialEmail !== undefined)
      teacher.officialEmail = updateTeacherDto.officialEmail;
    if (updateTeacherDto.department !== undefined)
      teacher.department = updateTeacherDto.department;
    if (updateTeacherDto.currentStatus !== undefined)
      teacher.currentStatus = updateTeacherDto.currentStatus;

    // Recompute displayName
    teacher.displayName = teacher.firstNameNp
      ? `${teacher.firstNameNp} ${teacher.lastNameNp ?? ''}`.trim()
      : `${teacher.firstNameEn} ${teacher.lastNameEn ?? ''}`.trim();

    return this.teacherRepository.save(teacher);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    await this.teacherRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async searchTeachers(schoolId: number, query: string): Promise<Teacher[]> {
    const normalizedQuery = query.normalize('NFC').toLowerCase();

    return this.teacherRepository
      .createQueryBuilder('teacher')
      .where('teacher.schoolId = :schoolId', { schoolId })
      .andWhere('teacher.isActive = true')
      .andWhere(
        `(LOWER(COALESCE(teacher.firstNameEn, '')) LIKE :search OR
          LOWER(COALESCE(teacher.lastNameEn, '')) LIKE :search OR
          LOWER(COALESCE(teacher.firstNameNp, '')) LIKE :search OR
          LOWER(COALESCE(teacher.lastNameNp, '')) LIKE :search OR
          teacher.employeeId LIKE :search OR
          COALESCE(teacher.personalMobile, '') LIKE :search OR
          COALESCE(teacher.officialEmail, '') LIKE :search)`,
        { search: `%${normalizedQuery}%` },
      )
      .orderBy('teacher.createdAt', 'DESC')
      .getMany();
  }

  async getTeacherWithDetails(id: number): Promise<any> {
    const teacher = await this.findOne(id);

    return {
      ...teacher,
      fullName: {
        en: teacher.getFullName('en'),
        np: teacher.getFullName('np') || teacher.getFullName('en'),
      },
      experience: teacher.joiningDate
        ? `${new Date().getFullYear() - new Date(teacher.joiningDate).getFullYear()} years`
        : 'N/A',
    };
  }
}
