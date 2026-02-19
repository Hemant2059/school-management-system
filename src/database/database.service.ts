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
        CREATE TABLE IF NOT EXISTS schools (
          school_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          phone VARCHAR(20),
          email VARCHAR(255),
          logo_url VARCHAR(500),
          established_year INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(100),
          phone VARCHAR(20),
          user_type VARCHAR(20) NOT NULL,
          school_id INTEGER REFERENCES schools(school_id),
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          is_system BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP,
          last_login_ip VARCHAR(45),
          failed_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          session_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
          refresh_token VARCHAR(500),
          device_info VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent TEXT,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
        CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      `);

      this.logger.log('Database schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize schema:', error.message);
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
