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
      'results',
      'student_promotions',
      'book_issues',
      'book_issues',
    ];

    const tablesToExport = tables || defaultTables;
    const data: Record<string, any[]> = {};

    for (const table of tablesToExport) {
      try {
        const result = await this.db.query(
          `SELECT * FROM ${table} WHERE school_id = $1`,
          [schoolId],
        );
        data[table] = result;
      } catch (e) {
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
