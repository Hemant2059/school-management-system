import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
        { phone: createUserDto.phone },
      ],
    });

    if (existing) {
      throw new BadRequestException(
        'User with this username/email/phone already exists',
      );
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
      isVerified: false,
      isActive: true,
      failedLoginAttempts: 0,
    });

    return this.userRepository.save(user);
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder
      .where('user.isActive = true')
      .orderBy('user.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsernameOrEmailOrPhone(identifier: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [
        { username: identifier, isActive: true },
        { email: identifier, isActive: true },
        { phone: identifier, isActive: true },
      ],
    });
  }

  async findOneWithSchool(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id, isActive: true },
      relations: ['school'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async incrementFailedLogin(userId: number): Promise<void> {
    await this.userRepository.increment({ userId }, 'failedLoginAttempts', 1);
  }

  async resetFailedLogins(userId: number): Promise<void> {
    await this.userRepository.update(userId, { failedLoginAttempts: 0 });
  }

  async lockAccount(userId: number, until: Date): Promise<void> {
    await this.userRepository.update(userId, { lockedUntil: until });
  }

  async updateLastLoginInfo(
    userId: number,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      lastLoginAgent: userAgent,
    });
  }

  async update(
    id: number,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email) {
      const existing = await this.userRepository.findOne({
        where: {
          email: updateUserDto.email,
          userId: Not(id),
          isActive: true,
        },
      });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.userRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }
}
