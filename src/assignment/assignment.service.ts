import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
  ) {}

  async create(createDto: CreateAssignmentDto): Promise<Assignment> {
    const bsDate = NepaliDateUtil.adToBs(createDto.dueDate).bsDate;
    const assignment = this.assignmentRepository.create({
      ...createDto,
      schoolId: createDto.schoolId,
      dueDateBs: bsDate,
      isPublished: false,
      isActive: true,
      totalMarks: createDto.totalMarks || 100,
    });
    return this.assignmentRepository.save(assignment);
  }

  async findAll(
    schoolId: number,
    classId: number,
    subjectId?: number,
  ): Promise<Assignment[]> {
    const where: any = {
      schoolId,
      classId,
      isActive: true,
      deletedAt: IsNull(),
    };
    if (subjectId) where.subjectId = subjectId;
    return this.assignmentRepository.find({
      where,
      order: { dueDate: 'DESC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Assignment> {
    const where: any = { assignmentId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const assignment = await this.assignmentRepository.findOne({
      where,
    });
    if (!assignment)
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    return assignment;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    const assignment = await this.findOne(id, schoolId);
    // ✅ FIXED: Set BS date directly on entity, NOT on DTO
    if (updateDto.dueDate && updateDto.dueDate !== assignment.dueDate) {
      assignment.dueDateBs = NepaliDateUtil.adToBs(updateDto.dueDate).bsDate;
    }
    Object.assign(assignment, updateDto);
    return this.assignmentRepository.save(assignment);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.assignmentRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async publishAssignment(id: number, schoolId: number): Promise<Assignment> {
    const assignment = await this.findOne(id, schoolId);
    assignment.isPublished = true;
    return this.assignmentRepository.save(assignment);
  }

  async getAssignmentsByNepaliMonth(
    schoolId: number,
    nepaliYear: number,
    nepaliMonth: number,
  ): Promise<Assignment[]> {
    const startDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-01`;
    const endDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-32`;
    const startDateAd = NepaliDateUtil.bsToAd(startDateBs);
    const endDateAd = NepaliDateUtil.bsToAd(endDateBs);

    return this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.schoolId = :schoolId', { schoolId })
      .andWhere('assignment.dueDate BETWEEN :start AND :end', {
        start: startDateAd,
        end: endDateAd,
      })
      .andWhere('assignment.isActive = true')
      .andWhere('assignment.deletedAt IS NULL')
      .orderBy('assignment.dueDate', 'ASC')
      .getMany();
  }
}
