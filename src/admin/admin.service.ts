import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  async exportData(schoolId: number, tables?: string[]): Promise<any> {
    const defaultTables = [
      'students',
      'guardians',
      'teachers',
      'users',
      'fees',
      'payments',
      'fee_categories',
      'fee_structures',
      'attendance',
      'exams',
      'marks',
      'student_promotions',
      'book_issues',
    ];
    // Tables without their own school_id are scoped through a parent.
    const scopedQueries: Record<string, string> = {
      student_promotions: `SELECT sp.* FROM student_promotions sp
        JOIN students s ON s.student_id = sp.student_id WHERE s.school_id = $1`,
      book_issues: `SELECT bi.* FROM book_issues bi
        JOIN books b ON b.book_id = bi.book_id WHERE b.school_id = $1`,
    };

    // Strict allowlist: only these tables may be exported. This both
    // prevents SQL injection via table names and blocks access to
    // sensitive tables (users.password_hash, user_sessions tokens, ...).
    const allowed = new Set(defaultTables);
    const tablesToExport = (tables || defaultTables).filter(
      (t) => allowed.has(t) && /^[a-z_]+$/.test(t),
    );
    // Column denylist for exported tables: never leak secrets.
    const safeUserCols = `user_id, username, email, full_name, full_name_np, phone, user_type,
      school_id, is_active, is_verified, is_system, last_login_at, created_at, updated_at`;
    const data: Record<string, any[]> = {};

    for (const table of tablesToExport) {
      try {
        const result = await this.db.query(
          table === 'users'
            ? `SELECT ${safeUserCols} FROM users WHERE school_id = $1`
            : (scopedQueries[table] ??
                `SELECT * FROM ${table} WHERE school_id = $1`),
          [schoolId],
        );
        data[table] = result;
      } catch {
        data[table] = [];
      }
    }

    return {
      schoolId,
      exportedAt: new Date().toISOString(),
      tables: Object.keys(data),
      data,
    };
  }

  async getDatabaseStats(schoolId: number): Promise<any> {
    const tables = [
      'students',
      'guardians',
      'teachers',
      'users',
      'fees',
      'payments',
      'attendance',
      'exams',
      'marks',
    ];

    const stats: Record<string, number> = {};

    for (const table of tables) {
      try {
        const result = await this.db.queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table} WHERE school_id = $1`,
          [schoolId],
        );
        stats[table] = parseInt(result?.count || '0');
      } catch {
        stats[table] = 0;
      }
    }

    return {
      schoolId,
      generatedAt: new Date().toISOString(),
      tableCounts: stats,
    };
  }

  async getTableSchema(tableName: string): Promise<any> {
    return this.db.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName],
    );
  }
}
