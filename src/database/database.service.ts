import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolConfig, PoolClient } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor() {
    const config: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'sms_nepal',
      schema: process.env.DB_SCHEMA || 'public',
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    if (process.env.NODE_ENV === 'production') {
      config.ssl = { rejectUnauthorized: false };
    }

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    this.initSchema();
  }

  private async initSchema() {
    try {
      this.logger.log('Initializing database schema...');

      await this.pool.query(`
        -- Drop existing tables for clean slate (only in dev)
        DROP TABLE IF EXISTS user_sessions CASCADE;
        DROP TABLE IF EXISTS student_guardians CASCADE;
        DROP TABLE IF EXISTS guardians CASCADE;
        DROP TABLE IF EXISTS marks CASCADE;
        DROP TABLE IF EXISTS exams CASCADE;
        DROP TABLE IF EXISTS attendance CASCADE;
        DROP TABLE IF EXISTS payments CASCADE;
        DROP TABLE IF EXISTS fees CASCADE;
        DROP TABLE IF EXISTS students CASCADE;
        DROP TABLE IF EXISTS subjects CASCADE;
        DROP TABLE IF EXISTS sections CASCADE;
        DROP TABLE IF EXISTS classes CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS schools CASCADE;
      `);

      await this.pool.query(`
        -- Schools
        CREATE TABLE IF NOT EXISTS schools (
          school_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL, address TEXT, phone VARCHAR(20), email VARCHAR(255),
          logo_url VARCHAR(500), established_year INTEGER,
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Users (updated with all required columns)
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, 
          password VARCHAR(255) NOT NULL, password_hash VARCHAR(255),
          full_name VARCHAR(100), phone VARCHAR(20), user_type VARCHAR(20) NOT NULL,
          school_id INTEGER REFERENCES schools(school_id),
          is_active BOOLEAN DEFAULT true, is_verified BOOLEAN DEFAULT false, is_system BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP, last_login_ip VARCHAR(45), 
          failed_login_attempts INTEGER DEFAULT 0, locked_until TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP
        );

        -- User Sessions
        CREATE TABLE IF NOT EXISTS user_sessions (
          session_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
          refresh_token VARCHAR(500), device_info VARCHAR(255), ip_address VARCHAR(45), user_agent TEXT,
          expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Classes
        CREATE TABLE IF NOT EXISTS classes (
          class_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          class_name VARCHAR(50) NOT NULL, class_code VARCHAR(20), class_order INTEGER,
          education_level VARCHAR(50), is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Sections
        CREATE TABLE IF NOT EXISTS sections (
          section_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          class_id INTEGER REFERENCES classes(class_id), section_name VARCHAR(20) NOT NULL, section_code VARCHAR(20),
          section_order INTEGER, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Subjects
        CREATE TABLE IF NOT EXISTS subjects (
          subject_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          subject_name_en VARCHAR(100) NOT NULL, subject_name_np VARCHAR(100),
          subject_code VARCHAR(20), subject_type VARCHAR(20), class_id INTEGER REFERENCES classes(class_id),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Students
        CREATE TABLE IF NOT EXISTS students (
          student_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          admission_number VARCHAR(50) UNIQUE NOT NULL, first_name_en VARCHAR(100) NOT NULL,
          middle_name_en VARCHAR(100), last_name_en VARCHAR(100), first_name_np VARCHAR(100),
          middle_name_np VARCHAR(100), last_name_np VARCHAR(100), gender VARCHAR(10),
          date_of_birth DATE, date_of_birth_bs VARCHAR(20), birthplace VARCHAR(100),
          nationality VARCHAR(50), ethnicity VARCHAR(50), religion VARCHAR(50),
          current_class_id INTEGER REFERENCES classes(class_id), current_section_id INTEGER REFERENCES sections(section_id),
          academic_year VARCHAR(10), roll_number INTEGER, current_status VARCHAR(20) DEFAULT 'ACTIVE',
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Guardians
        CREATE TABLE IF NOT EXISTS guardians (
          guardian_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          first_name VARCHAR(100) NOT NULL, middle_name VARCHAR(100), last_name VARCHAR(100),
          phone VARCHAR(20), email VARCHAR(255), occupation VARCHAR(100),
          relationship VARCHAR(50), is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Student Guardians
        CREATE TABLE IF NOT EXISTS student_guardians (
          student_guardian_id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES students(student_id), guardian_id INTEGER REFERENCES guardians(guardian_id),
          relationship_type VARCHAR(20) NOT NULL, is_primary BOOLEAN DEFAULT false,
          is_emergency_contact BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Fees
        CREATE TABLE IF NOT EXISTS fees (
          fee_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), fee_type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL, discount_amount DECIMAL(10,2), fine_amount DECIMAL(10,2),
          total_amount DECIMAL(10,2), due_date DATE, status VARCHAR(20) DEFAULT 'pending',
          academic_year VARCHAR(10), class_id INTEGER, section_id INTEGER, invoice_number VARCHAR(50),
          is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Payments
        CREATE TABLE IF NOT EXISTS payments (
          payment_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), fee_id INTEGER REFERENCES fees(fee_id),
          amount DECIMAL(10,2) NOT NULL, payment_date DATE, payment_method VARCHAR(50),
          transaction_id VARCHAR(100), received_by INTEGER, bank_name VARCHAR(100), cheque_number VARCHAR(50),
          remarks TEXT, idempotency_key VARCHAR(100), is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Attendance
        CREATE TABLE IF NOT EXISTS attendance (
          attendance_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), attendance_date DATE NOT NULL,
          status VARCHAR(20) NOT NULL, remarks TEXT, marked_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Exams
        CREATE TABLE IF NOT EXISTS exams (
          exam_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          exam_name VARCHAR(100) NOT NULL, exam_type VARCHAR(50), class_id INTEGER REFERENCES classes(class_id),
          academic_year VARCHAR(10), start_date DATE, end_date DATE, is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Marks
        CREATE TABLE IF NOT EXISTS marks (
          mark_id SERIAL PRIMARY KEY, school_id INTEGER REFERENCES schools(school_id),
          student_id INTEGER REFERENCES students(student_id), exam_id INTEGER REFERENCES exams(exam_id),
          subject_id INTEGER REFERENCES subjects(subject_id), class_id INTEGER, section_id INTEGER,
          academic_year VARCHAR(10), theory_marks DECIMAL(5,2), practical_marks DECIMAL(5,2),
          total_marks DECIMAL(5,2), grade VARCHAR(5), is_absent BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
        CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
        CREATE INDEX IF NOT EXISTS idx_sections_school ON sections(school_id);
        CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);
        CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
        CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
      `);

      this.logger.log('Database schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize schema: ' + error.message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }

  // Basic query methods
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] || null;
  }

  async insert<T = any>(text: string, params?: any[]): Promise<T> {
    const result = await this.pool.query(text, params);
    return result.rows[0];
  }

  async update(text: string, params?: any[]): Promise<number> {
    const result = await this.pool.query(text, params);
    return result.rowCount || 0;
  }

  async delete(text: string, params?: any[]): Promise<number> {
    return this.update(text, params);
  }

  // Transaction support
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Bulk insert
  async bulkInsert<T = any>(
    tableName: string,
    data: Record<string, any>[],
    returning: string = '*',
  ): Promise<T[]> {
    if (data.length === 0) return [];

    const columns = Object.keys(data[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    data.forEach((row, rowIndex) => {
      const rowPlaceholders: string[] = [];
      columns.forEach((col, colIndex) => {
        values.push(row[col]);
        rowPlaceholders.push(`$${rowIndex * columns.length + colIndex + 1}`);
      });
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders.join(', ')}
      RETURNING ${returning}
    `;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // Bulk update
  async bulkUpdate(
    tableName: string,
    data: Record<string, any>[],
    idColumn: string = 'id',
  ): Promise<number> {
    if (data.length === 0) return 0;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      let totalUpdated = 0;
      for (const row of data) {
        const id = row[idColumn];
        const updateData = { ...row };
        delete updateData[idColumn];

        const setClause = Object.keys(updateData)
          .map((key, i) => `${key} = $${i + 1}`)
          .join(', ');
        const values = [...Object.values(updateData), id];

        const result = await client.query(
          `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = $${values.length}`,
          values,
        );
        totalUpdated += result.rowCount || 0;
      }

      await client.query('COMMIT');
      return totalUpdated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Count records
  async count(
    tableName: string,
    whereClause?: string,
    params?: any[],
  ): Promise<number> {
    const query = whereClause
      ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${tableName}`;

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  // Check if record exists
  async exists(
    tableName: string,
    whereClause: string,
    params?: any[],
  ): Promise<boolean> {
    const query = `SELECT 1 FROM ${tableName} WHERE ${whereClause} LIMIT 1`;
    const result = await this.pool.query(query, params);
    return result.rows.length > 0;
  }

  // Soft delete
  async softDelete(
    tableName: string,
    idColumn: string,
    id: any,
  ): Promise<number> {
    return this.update(
      `UPDATE ${tableName} SET deleted_at = NOW() WHERE ${idColumn} = $1`,
      [id],
    );
  }

  // Hard delete
  async hardDelete(
    tableName: string,
    idColumn: string,
    id: any,
  ): Promise<number> {
    return this.delete(`DELETE FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
  }

  // Pagination
  async paginate<T = any>(
    query: string,
    page: number = 1,
    limit: number = 10,
    params?: any[],
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = query
      .replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM')
      .replace(/ORDER BY.*$/i, '')
      .replace(/LIMIT.*$/i, '')
      .replace(/OFFSET.*$/i, '');

    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Get paginated data
    const paginatedQuery = `${query} LIMIT $${(params?.length || 0) + 1} OFFSET $${(params?.length || 0) + 2}`;
    const dataParams = [...(params || []), limit, offset];
    const dataResult = await this.pool.query(paginatedQuery, dataParams);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  // Upsert (INSERT ON CONFLICT UPDATE)
  async upsert<T = any>(
    tableName: string,
    data: Record<string, any>,
    conflictColumns: string[],
    updateColumns?: string[],
  ): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const updateCols =
      updateColumns || columns.filter((col) => !conflictColumns.includes(col));
    const updateClause = updateCols
      .map((col, i) => `${col} = $${columns.length + i + 1}`)
      .join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (${conflictColumns.join(', ')})
      DO UPDATE SET ${updateClause}
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      ...values,
      ...updateCols.map((c) => data[c]),
    ]);
    return result.rows[0];
  }

  // Raw query with client for complex operations
  getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // Execute with retry logic
  async executeWithRetry<T>(
    callback: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await callback();
      } catch (error) {
        lastError = error as Error;
        console.error(`Query failed, retry ${i + 1}/${maxRetries}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }

    throw lastError ?? new Error('Unknown error in executeWithRetry');
  }

  // Get schema name
  getSchema(): string {
    return process.env.DB_SCHEMA || 'public';
  }
}
