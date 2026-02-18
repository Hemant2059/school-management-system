import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Timetable } from './entities/timetable.entity';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
  ) {}

  async create(createDto: CreateTimetableDto): Promise<Timetable> {
    const conflict = await this.timetableRepository.findOne({
      where: {
        schoolId: createDto.schoolId,
        classId: createDto.classId,
        sectionId: createDto.sectionId,
        dayOfWeek: createDto.dayOfWeek,
        periodNumber: createDto.periodNumber,
        isActive: true,
        deletedAt: IsNull(),
      },
    });

    if (conflict) {
      throw new BadRequestException('Timetable slot already occupied');
    }

    const timetable = this.timetableRepository.create(createDto);
    return this.timetableRepository.save(timetable);
  }

  async findAll(
    schoolId: number,
    classId: number,
    sectionId?: number,
  ): Promise<Timetable[]> {
    const where: any = {
      schoolId,
      classId,
      isActive: true,
      deletedAt: IsNull(),
    };
    if (sectionId) where.sectionId = sectionId;
    return this.timetableRepository.find({
      where,
      order: { dayOfWeek: 'ASC', periodNumber: 'ASC' },
    });
  }

  async findOne(id: number, schoolId?: number): Promise<Timetable> {
    const where: any = { timetableId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const timetable = await this.timetableRepository.findOne({
      where,
    });
    if (!timetable)
      throw new NotFoundException(`Timetable with ID ${id} not found`);
    return timetable;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateTimetableDto,
  ): Promise<Timetable> {
    const timetable = await this.findOne(id, schoolId);
    Object.assign(timetable, updateDto);
    return this.timetableRepository.save(timetable);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.timetableRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  async getWeeklyTimetable(
    schoolId: number,
    classId: number,
    sectionId?: number,
  ): Promise<any> {
    const timetables = await this.findAll(schoolId, classId, sectionId);
    // ✅ FIXED: Explicitly type the array to avoid 'never' inference
    const weeklySchedule: any[][] = Array.from({ length: 7 }, () => []);

    timetables.forEach((tt) => {
      weeklySchedule[tt.dayOfWeek].push({
        ...tt,
        dayName: this.getDayName(tt.dayOfWeek, 'en'),
        dayNameNp: this.getDayName(tt.dayOfWeek, 'np'),
      });
    });

    return {
      classId,
      sectionId,
      schedule: weeklySchedule.map((periods, dayIndex) => ({
        dayIndex,
        dayName: this.getDayName(dayIndex, 'en'),
        dayNameNp: this.getDayName(dayIndex, 'np'),
        // ✅ FIXED: Type assertion to access periodNumber
        periods: periods.sort(
          (a: any, b: any) => a.periodNumber - b.periodNumber,
        ),
      })),
    };
  }

  private getDayName(dayIndex: number, language: 'en' | 'np'): string {
    const daysEn = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const daysNp = [
      'आइतबार',
      'सोमबार',
      'मंगलबार',
      'बुधबार',
      'बिहिबार',
      'शुक्रबार',
      'शनिबार',
    ];
    return language === 'np' ? daysNp[dayIndex] : daysEn[dayIndex];
  }
}
