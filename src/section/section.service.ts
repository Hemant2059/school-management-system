import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './entities/section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  async create(createDto: CreateSectionDto): Promise<Section> {
    const existing = await this.sectionRepository.findOne({
      where: {
        sectionCode: createDto.sectionCode,
        classId: createDto.classId,
        schoolId: createDto.schoolId,
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Section ${createDto.sectionCode} already exists in this class`,
      );
    }

    const section = this.sectionRepository.create({
      schoolId: createDto.schoolId,
      classId: createDto.classId,
      sectionName: createDto.sectionName,
      sectionCode: createDto.sectionCode,
      sectionOrder: createDto.sectionOrder ?? 0,
      capacity: createDto.capacity,
      isActive: true,
    });

    return this.sectionRepository.save(section);
  }

  async findAll(schoolId: number, classId?: number): Promise<Section[]> {
    const where: any = { schoolId, isActive: true };
    if (classId) where.classId = classId;

    return this.sectionRepository.find({
      where,
      order: { sectionOrder: 'ASC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Section> {
    const where: any = { sectionId: id, isActive: true };
    if (schoolId) where.schoolId = schoolId;

    const section = await this.sectionRepository.findOne({
      where,
    });
    if (!section)
      throw new NotFoundException(`Section with ID ${id} not found`);
    return section;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateSectionDto,
  ): Promise<Section> {
    const section = await this.findOne(id, schoolId);
    if (updateDto.sectionName !== undefined)
      section.sectionName = updateDto.sectionName;
    if (updateDto.sectionCode !== undefined)
      section.sectionCode = updateDto.sectionCode;
    if (updateDto.sectionOrder !== undefined)
      section.sectionOrder = updateDto.sectionOrder;
    if (updateDto.capacity !== undefined) section.capacity = updateDto.capacity;
    return this.sectionRepository.save(section);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.sectionRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async getSectionsWithClassInfo(
    schoolId: number,
    classId: number,
  ): Promise<any[]> {
    return this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin('section.academicClass', 'class')
      .select([
        'section.sectionId',
        'section.sectionName',
        'section.sectionCode',
        'section.capacity',
        'class.className',
        'class.classCode',
      ])
      .where('section.schoolId = :schoolId', { schoolId })
      .andWhere('section.classId = :classId', { classId })
      .andWhere('section.isActive = true')
      .getMany();
  }
}
