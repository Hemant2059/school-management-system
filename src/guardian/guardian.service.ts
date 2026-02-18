import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guardian } from './entities/guardian.entity';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(Guardian)
    private guardianRepository: Repository<Guardian>,
  ) {}

  async create(createGuardianDto: CreateGuardianDto): Promise<Guardian> {
    // ✅ Type-safe property access using optional chaining
    const existing = await this.guardianRepository.findOne({
      where: {
        mobile: createGuardianDto.mobile,
        schoolId: createGuardianDto.schoolId,
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Guardian with this mobile number already exists',
      );
    }

    const count = await this.guardianRepository.count({
      where: { schoolId: createGuardianDto.schoolId },
    });
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const guardianCode = `GRD-${yearSuffix}-${String(count + 1).padStart(5, '0')}`;

    // ✅ Safe displayName computation with fallbacks
    const displayName = createGuardianDto.firstNameNp
      ? `${createGuardianDto.firstNameNp} ${createGuardianDto.lastNameNp ?? ''}`.trim()
      : `${createGuardianDto.firstNameEn} ${createGuardianDto.lastNameEn ?? ''}`.trim();

    // ✅ Create entity with explicit property mapping (no spread operator issues)
    const guardian = this.guardianRepository.create({
      guardianCode,
      schoolId: createGuardianDto.schoolId,
      firstNameEn: createGuardianDto.firstNameEn,
      middleNameEn: createGuardianDto.middleNameEn,
      lastNameEn: createGuardianDto.lastNameEn,
      firstNameNp: createGuardianDto.firstNameNp,
      middleNameNp: createGuardianDto.middleNameNp,
      lastNameNp: createGuardianDto.lastNameNp,
      relationToStudent: createGuardianDto.relationToStudent,
      occupation: createGuardianDto.occupation,
      organization: createGuardianDto.organization,
      designation: createGuardianDto.designation,
      educationLevel: createGuardianDto.educationLevel,
      annualIncome: createGuardianDto.annualIncome,
      mobile: createGuardianDto.mobile,
      alternateMobile: createGuardianDto.alternateMobile,
      email: createGuardianDto.email,
      whatsappNumber: createGuardianDto.whatsappNumber,
      provinceId: createGuardianDto.provinceId,
      districtId: createGuardianDto.districtId,
      municipalityId: createGuardianDto.municipalityId,
      wardNo: createGuardianDto.wardNo,
      toleEn: createGuardianDto.toleEn,
      addressEn: createGuardianDto.addressEn,
      toleNp: createGuardianDto.toleNp,
      addressNp: createGuardianDto.addressNp,
      displayName,
      isActive: true,
    });

    return this.guardianRepository.save(guardian);
  }

  async findAll(schoolId: number): Promise<Guardian[]> {
    return this.guardianRepository.find({
      where: { schoolId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Guardian> {
    const where: any = { guardianId: id, isActive: true };
    if (schoolId) where.schoolId = schoolId;

    const guardian = await this.guardianRepository.findOne({
      where,
    });

    if (!guardian) {
      throw new NotFoundException(`Guardian with ID ${id} not found`);
    }

    return guardian;
  }

  async findByMobile(mobile: string, schoolId: number): Promise<Guardian> {
    const guardian = await this.guardianRepository.findOne({
      where: { mobile, schoolId, isActive: true },
    });

    if (!guardian) {
      throw new NotFoundException(
        `Guardian with mobile ${mobile} not found in this school`,
      );
    }

    return guardian;
  }

  async update(
    id: number,
    schoolId: number,
    updateGuardianDto: UpdateGuardianDto,
  ): Promise<Guardian> {
    const guardian = await this.findOne(id, schoolId);

    // ✅ Safe update with explicit property assignment
    if (updateGuardianDto.firstNameEn !== undefined)
      guardian.firstNameEn = updateGuardianDto.firstNameEn;
    if (updateGuardianDto.lastNameEn !== undefined)
      guardian.lastNameEn = updateGuardianDto.lastNameEn;
    if (updateGuardianDto.firstNameNp !== undefined)
      guardian.firstNameNp = updateGuardianDto.firstNameNp;
    if (updateGuardianDto.lastNameNp !== undefined)
      guardian.lastNameNp = updateGuardianDto.lastNameNp;
    if (updateGuardianDto.relationToStudent !== undefined)
      guardian.relationToStudent = updateGuardianDto.relationToStudent;
    if (updateGuardianDto.mobile !== undefined)
      guardian.mobile = updateGuardianDto.mobile;
    // ... other properties can be added similarly ...

    // ✅ Recompute displayName safely
    guardian.displayName = guardian.firstNameNp
      ? `${guardian.firstNameNp} ${guardian.lastNameNp ?? ''}`.trim()
      : `${guardian.firstNameEn} ${guardian.lastNameEn ?? ''}`.trim();

    return this.guardianRepository.save(guardian);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.guardianRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async searchGuardians(schoolId: number, query: string): Promise<Guardian[]> {
    const normalizedQuery = query.normalize('NFC').toLowerCase();

    return this.guardianRepository
      .createQueryBuilder('guardian')
      .where('guardian.schoolId = :schoolId', { schoolId })
      .andWhere('guardian.isActive = true')
      .andWhere(
        `(LOWER(COALESCE(guardian.firstNameEn, '')) LIKE :search OR
          LOWER(COALESCE(guardian.lastNameEn, '')) LIKE :search OR
          LOWER(COALESCE(guardian.firstNameNp, '')) LIKE :search OR
          LOWER(COALESCE(guardian.lastNameNp, '')) LIKE :search OR
          guardian.mobile LIKE :search OR
          COALESCE(guardian.email, '') LIKE :search)`,
        { search: `%${normalizedQuery}%` },
      )
      .orderBy('guardian.createdAt', 'DESC')
      .getMany();
  }

  async getGuardianWithDetails(id: number, schoolId: number): Promise<any> {
    const guardian = await this.findOne(id, schoolId);

    return {
      ...guardian,
      fullName: {
        en: `${guardian.firstNameEn} ${guardian.middleNameEn ?? ''} ${guardian.lastNameEn}`.trim(),
        np: guardian.firstNameNp
          ? `${guardian.firstNameNp} ${guardian.middleNameNp ?? ''} ${guardian.lastNameNp}`.trim()
          : `${guardian.firstNameEn} ${guardian.middleNameEn ?? ''} ${guardian.lastNameEn}`.trim(),
      },
    };
  }
}
