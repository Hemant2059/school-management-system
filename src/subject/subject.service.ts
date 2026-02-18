import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { GetSubjectsDto } from './dto/get-subjects.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  async create(createDto: CreateSubjectDto): Promise<Subject> {
    const existing = await this.subjectRepository.findOne({
      where: {
        subjectCode: createDto.subjectCode,
        schoolId: createDto.schoolId,
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new BadRequestException('Subject code already exists');
    }

    const subject = this.subjectRepository.create(createDto);
    return this.subjectRepository.save(subject);
  }

  async findAll(
    schoolId: number,
    getSubjectsDto: GetSubjectsDto,
  ): Promise<Subject[]> {
    const where: any = {
      schoolId,
      deletedAt: IsNull(),
    };

    if (getSubjectsDto.isActive !== undefined) {
      where.isActive = getSubjectsDto.isActive;
    } else {
      where.isActive = true;
    }

    if (getSubjectsDto.subjectGroup) {
      where.subjectGroup = getSubjectsDto.subjectGroup;
    }

    if (getSubjectsDto.search) {
      const query = this.subjectRepository
        .createQueryBuilder('subject')
        .where('subject.schoolId = :schoolId', { schoolId })
        .andWhere('subject.deletedAt IS NULL');

      if (getSubjectsDto.isActive !== undefined) {
        query.andWhere('subject.isActive = :isActive', {
          isActive: getSubjectsDto.isActive,
        });
      } else {
        query.andWhere('subject.isActive = :isActive', { isActive: true });
      }

      if (getSubjectsDto.subjectGroup) {
        query.andWhere('subject.subjectGroup = :group', {
          group: getSubjectsDto.subjectGroup,
        });
      }

      query.andWhere(
        '(LOWER(subject.subjectName) LIKE :search OR LOWER(subject.subjectCode) LIKE :search)',
        { search: `%${getSubjectsDto.search.toLowerCase()}%` },
      );

      return query.getMany();
    }

    // If no complex search, use simple find
    return this.subjectRepository.find({
      where,
      order: { subjectName: 'ASC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Subject> {
    const where: any = { subjectId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const subject = await this.subjectRepository.findOne({
      where,
    });
    if (!subject)
      throw new NotFoundException(`Subject with ID ${id} not found`);
    return subject;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateSubjectDto,
  ): Promise<Subject> {
    const subject = await this.findOne(id, schoolId);
    Object.assign(subject, updateDto);
    return this.subjectRepository.save(subject);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.subjectRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async getSubjectsByGroup(
    schoolId: number,
    group: string,
  ): Promise<Subject[]> {
    return this.subjectRepository.find({
      where: {
        schoolId,
        subjectGroup: group,
        isActive: true,
        deletedAt: IsNull(),
      },
      order: { subjectName: 'ASC' },
    });
  }
}
