import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import {
  withBsDates,
  withBsDatesArray,
} from '../utils/response-with-bs-dates.util';

const SCHOOL_DATE_KEYS = [
  'establishedDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    userId: number = 1,
  ): Promise<School> {
    const existing = await this.schoolRepository.findOne({
      where: [
        { schoolName: createSchoolDto.schoolName, isActive: true },
        { schoolCode: createSchoolDto.schoolCode, isActive: true },
      ],
    });

    if (existing) {
      if (existing.schoolCode === createSchoolDto.schoolCode) {
        throw new BadRequestException('School with this code already exists');
      }
      throw new BadRequestException('School with this name already exists');
    }

    // const count = await this.schoolRepository.count();
    // const yearSuffix = new Date().getFullYear().toString().slice(-2);
    // const schoolCode = `SMS-NP-${yearSuffix}-${String(count + 1).padStart(4, '0')}`;
    const schoolCode = createSchoolDto.schoolCode;

    const school = this.schoolRepository.create({
      ...createSchoolDto,
      schoolCode,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.schoolRepository.save(school);
    return withBsDates(saved, SCHOOL_DATE_KEYS);
  }

  async findAll(): Promise<(School & Record<string, string>)[]> {
    const list = await this.schoolRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return withBsDatesArray(list, SCHOOL_DATE_KEYS);
  }

  async findOne(id: number): Promise<School & Record<string, string>> {
    const school = await this.schoolRepository.findOne({
      where: { schoolId: id, isActive: true },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return withBsDates(school, SCHOOL_DATE_KEYS);
  }

  async update(
    id: number,
    updateSchoolDto: UpdateSchoolDto,
    userId: number = 1,
  ): Promise<School> {
    const school = await this.findOne(id);

    if (updateSchoolDto.affiliationNumber && school.affiliationNumber) {
      throw new BadRequestException(
        'Affiliation number cannot be changed after creation',
      );
    }

    Object.assign(school, {
      ...updateSchoolDto,
      updatedBy: userId,
    });

    const saved = await this.schoolRepository.save(school);
    return withBsDates(saved, SCHOOL_DATE_KEYS);
  }

  async remove(id: number, userId: number = 1): Promise<void> {
    await this.findOne(id);

    await this.schoolRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
      updatedBy: userId,
    });
  }

  async getSchoolWithNepaliDate(id: number): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { schoolId: id, isActive: true },
    });
    if (!school) throw new NotFoundException(`School with ID ${id} not found`);

    let bsDate = school.establishedDateBs;
    if (!bsDate && school.establishedDate) {
      bsDate = NepaliDateUtil.adToBs(school.establishedDate).bsDate;
    }

    return {
      ...withBsDates(school, SCHOOL_DATE_KEYS),
      establishedDateBs: bsDate,
      localized: {
        schoolName: school.schoolNameNepali || school.schoolName,
        establishedDateBs: bsDate,
        address: school.streetAddressNepali || school.streetAddress,
        tole: school.toleNepali || school.tole,
      },
    };
  }
}
