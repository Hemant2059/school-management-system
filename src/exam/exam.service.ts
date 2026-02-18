import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
  ) {}

  async create(createDto: CreateExamDto): Promise<Exam> {
    const bsDate = NepaliDateUtil.adToBs(createDto.examDate).bsDate;
    const exam = this.examRepository.create({
      ...createDto,
      schoolId: createDto.schoolId,
      examDateBs: bsDate,
      isPublished: false,
      isActive: true,
    });
    return this.examRepository.save(exam);
  }

  async findAll(
    schoolId: number,
    classId?: number,
    examType?: string,
  ): Promise<Exam[]> {
    const where: any = { schoolId, isActive: true, deletedAt: IsNull() };
    if (classId) where.classId = classId;
    if (examType) where.examType = examType;
    return this.examRepository.find({ where, order: { examDate: 'ASC' } });
  }

  async findOne(id: number, schoolId?: number): Promise<Exam> {
    const where: any = { examId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const exam = await this.examRepository.findOne({
      where,
    });
    if (!exam) throw new NotFoundException(`Exam with ID ${id} not found`);
    return exam;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateExamDto,
  ): Promise<Exam> {
    const exam = await this.findOne(id, schoolId);
    // ✅ FIXED: Set BS date directly on entity, NOT on DTO
    if (updateDto.examDate && updateDto.examDate !== exam.examDate) {
      exam.examDateBs = NepaliDateUtil.adToBs(updateDto.examDate).bsDate;
    }
    Object.assign(exam, updateDto);
    return this.examRepository.save(exam);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.examRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async publishExam(id: number, schoolId: number): Promise<Exam> {
    const exam = await this.findOne(id, schoolId);
    exam.isPublished = true;
    return this.examRepository.save(exam);
  }

  async getExamsByNepaliMonth(
    schoolId: number,
    nepaliYear: number,
    nepaliMonth: number,
  ): Promise<Exam[]> {
    const startDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-01`;
    const endDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-32`;
    const startDateAd = NepaliDateUtil.bsToAd(startDateBs);
    const endDateAd = NepaliDateUtil.bsToAd(endDateBs);

    return this.examRepository
      .createQueryBuilder('exam')
      .where('exam.examDate BETWEEN :start AND :end', {
        start: startDateAd,
        end: endDateAd,
      })
      .andWhere('exam.schoolId = :schoolId', { schoolId })
      .andWhere('exam.isActive = true')
      .andWhere('exam.deletedAt IS NULL')
      .orderBy('exam.examDate', 'ASC')
      .getMany();
  }
}
