import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicClass } from './entities/academic-class.entity';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';

@Injectable()
export class AcademicClassService {
  constructor(
    @InjectRepository(AcademicClass)
    private academicClassRepository: Repository<AcademicClass>,
  ) {}

  async create(createDto: CreateAcademicClassDto): Promise<AcademicClass> {
    const existing = await this.academicClassRepository.findOne({
      where: {
        classCode: createDto.classCode,
        schoolId: createDto.schoolId,
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Class code ${createDto.classCode} already exists in this school`,
      );
    }

    const academicClass = this.academicClassRepository.create({
      schoolId: createDto.schoolId,
      className: createDto.className,
      classCode: createDto.classCode,
      classOrder: createDto.classOrder,
      educationLevel: createDto.educationLevel,
      minAge: createDto.minAge,
      maxAge: createDto.maxAge,
      isActive: true,
    });

    return this.academicClassRepository.save(academicClass);
  }

  // ✅ FIXED: Method signature matches controller call
  async findAll(schoolId: number): Promise<AcademicClass[]> {
    return this.academicClassRepository.find({
      where: { schoolId, isActive: true },
      order: { classOrder: 'ASC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<AcademicClass> {
    const where: any = { classId: id, isActive: true };
    if (schoolId) where.schoolId = schoolId;

    const academicClass = await this.academicClassRepository.findOne({
      where,
    });
    if (!academicClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return academicClass;
  }

  // ✅ FIXED: Added missing method
  async getClassesByLevel(
    schoolId: number,
    level: string,
  ): Promise<AcademicClass[]> {
    return this.academicClassRepository.find({
      where: { schoolId, educationLevel: level, isActive: true },
      order: { classOrder: 'ASC' },
    });
  }

  // ✅ FIXED: Added missing method
  async findBySchoolAndCode(
    schoolId: number,
    classCode: string,
  ): Promise<AcademicClass> {
    const academicClass = await this.academicClassRepository.findOne({
      where: { schoolId, classCode, isActive: true },
    });
    if (!academicClass) {
      throw new NotFoundException(
        `Class ${classCode} not found in school ${schoolId}`,
      );
    }
    return academicClass;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateAcademicClassDto,
  ): Promise<AcademicClass> {
    const academicClass = await this.findOne(id, schoolId);
    if (updateDto.className !== undefined)
      academicClass.className = updateDto.className;
    if (updateDto.classCode !== undefined)
      academicClass.classCode = updateDto.classCode;
    if (updateDto.classOrder !== undefined)
      academicClass.classOrder = updateDto.classOrder;
    if (updateDto.educationLevel !== undefined)
      academicClass.educationLevel = updateDto.educationLevel;
    if (updateDto.minAge !== undefined) academicClass.minAge = updateDto.minAge;
    if (updateDto.maxAge !== undefined) academicClass.maxAge = updateDto.maxAge;
    return this.academicClassRepository.save(academicClass);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.academicClassRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }
}
