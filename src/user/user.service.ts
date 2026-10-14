import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from './entities/interfaces';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PageOptionsDto } from '../common/dto/page-options.dto';
import { PageDto } from '../common/dto/page.dto';
import { PageMetaDto } from '../common/dto/page-meta.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.db.queryOne<User>(
      `SELECT * FROM users WHERE username = $1 OR (email = $2 AND $2 IS NOT NULL) OR (phone = $3 AND $3 IS NOT NULL)`,
      [
        createUserDto.username,
        createUserDto.email || null,
        createUserDto.phone || null,
      ],
    );

    if (existing) {
      throw new BadRequestException(
        'User with this username/email/phone already exists',
      );
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const schoolId = createUserDto.schoolId || createUserDto.school_id || 1;
    const email =
      createUserDto.email || `${createUserDto.username}@school.edu.np`;
    const phone = createUserDto.phone || null;
    const userType = createUserDto.userType || 'TEACHER';

    const user = await this.db.insert<User>(
      `INSERT INTO users (school_id, username, email, phone, password, password_hash, full_name, full_name_np, user_type, is_verified, is_active, failed_login_attempts)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, false, true, 0)
       RETURNING *`,
      [
        schoolId,
        createUserDto.username,
        email,
        phone,
        passwordHash,
        createUserDto.fullName,
        createUserDto.fullNameNp || null,
        userType,
      ],
    );

    return user;
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    const page = pageOptionsDto.page || 1;
    const take = pageOptionsDto.take || 10;
    const offset = (page - 1) * take;

    const users = await this.db.query<User>(
      `SELECT * FROM users WHERE is_active = true ORDER BY created_at ${pageOptionsDto.order || 'DESC'} LIMIT $1 OFFSET $2`,
      [take, offset],
    );

    const [countResult] = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users WHERE is_active = true`,
    );

    const itemCount = parseInt(countResult.count, 10);
    const pageMeta = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(users, pageMeta);
  }

  async findById(id: number): Promise<User> {
    const user = await this.db.queryOne<User>(
      `SELECT * FROM users WHERE user_id = $1 AND is_active = true`,
      [id],
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOne(id: number): Promise<User | null> {
    return this.findById(id);
  }

  async findByUsernameOrEmailOrPhone(identifier: string): Promise<User | null> {
    return this.db.queryOne<User>(
      `SELECT * FROM users WHERE (username = $1 OR email = $1 OR phone = $1) AND is_active = true`,
      [identifier],
    );
  }

  async findOneWithSchool(id: number): Promise<User> {
    const user = await this.findById(id);
    return user;
  }

  async incrementFailedLogin(userId: number): Promise<void> {
    await this.db.query(
      `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = $1`,
      [userId],
    );
  }

  async resetFailedLogins(userId: number): Promise<void> {
    await this.db.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = $1`,
      [userId],
    );
  }

  async lockAccount(userId: number, lockedUntil: Date): Promise<void> {
    await this.db.query(
      `UPDATE users SET locked_until = $2 WHERE user_id = $1`,
      [userId, lockedUntil],
    );
  }

  async updateLastLoginInfo(
    userId: number,
    ip: string,
    _userAgent: string,
  ): Promise<void> {
    await this.db.query(
      `UPDATE users SET last_login_at = NOW(), last_login_ip = $2 WHERE user_id = $1`,
      [userId, ip],
    );
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.db.query(
      `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE user_id = $1`,
      [userId, passwordHash],
    );
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findById(id);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateUserDto.email) {
      updates.push(`email = $${paramIndex++}`);
      params.push(updateUserDto.email);
    }
    if (updateUserDto.phone) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(updateUserDto.phone);
    }
    if (updateUserDto.fullName) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(updateUserDto.fullName);
    }
    if (updateUserDto.fullNameNp !== undefined) {
      updates.push(`full_name_np = $${paramIndex++}`);
      params.push(updateUserDto.fullNameNp || null);
    }
    if (updateUserDto.password) {
      const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(passwordHash);
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
        params,
      );
    }

    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.db.query(
      `UPDATE users SET is_active = false, deleted_at = NOW() WHERE user_id = $1`,
      [id],
    );
  }
}
