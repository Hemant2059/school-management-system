import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SchoolOverview {
  school_id: number;
  name: string;
  status: string;
  students: number;
  teachers: number;
  users: number;
  openInvoices: number;
  invoicedTotal: number;
  outstandingBalance: number;
  attendanceToday: { present: number; absent: number };
}

@Injectable()
export class PlatformService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Cross-school overview for platform admins. Each school is read inside
   * its own tenant transaction (RLS-safe aggregation in Node) — no policy
   * bypass needed.
   */
  async getOverview(): Promise<{
    schools: SchoolOverview[];
    totals: {
      schools: number;
      students: number;
      teachers: number;
      users: number;
      outstandingBalance: number;
    };
  }> {
    const schools = await this.db.query<{
      school_id: number;
      name: string;
      status: string;
    }>(
      `SELECT school_id, name, status FROM schools ORDER BY school_id`,
    );
    const out: SchoolOverview[] = [];
    for (const s of schools) {
      // Explicit school_id predicates (not RLS): the app role is a DB
      // superuser, so RLS policies never filter its queries. Every other
      // service scopes the same way.
      const stats = await this.db.tenantTransaction(
        s.school_id,
        async (client) => {
          const one = async <T>(text: string, params: any[] = []) => {
            const r = await client.query(text, params);
            return r.rows[0] as T;
          };
          const students = await one<{ c: string }>(
            `SELECT COUNT(*)::text AS c FROM students WHERE school_id = $1 AND is_active = true`,
            [s.school_id],
          );
          const teachers = await one<{ c: string }>(
            `SELECT COUNT(*)::text AS c FROM teachers WHERE school_id = $1 AND is_active = true`,
            [s.school_id],
          );
          const users = await one<{ c: string }>(
            `SELECT COUNT(*)::text AS c FROM users WHERE school_id = $1 AND is_active = true`,
            [s.school_id],
          );
          const inv = await one<{ n: string; g: string; b: string }>(
            `SELECT COUNT(*)::text AS n,
                    COALESCE(SUM(grand_total), 0)::text AS g,
                    COALESCE(SUM(balance), 0)::text AS b
               FROM fee_invoices WHERE school_id = $1 AND status IN ('ISSUED','PARTIAL','OVERDUE')`,
            [s.school_id],
          );
          const att = await one<{ p: string; a: string }>(
            `SELECT COUNT(*) FILTER (WHERE status = 'PRESENT')::text AS p,
                    COUNT(*) FILTER (WHERE status = 'ABSENT')::text AS a
               FROM attendance WHERE school_id = $1 AND attendance_date = CURRENT_DATE`,
            [s.school_id],
          );
          return { students, teachers, users, inv, att };
        },
      );
      out.push({
        school_id: s.school_id,
        name: s.name,
        status: s.status,
        students: parseInt(stats.students?.c || '0', 10),
        teachers: parseInt(stats.teachers?.c || '0', 10),
        users: parseInt(stats.users?.c || '0', 10),
        openInvoices: parseInt(stats.inv?.n || '0', 10),
        invoicedTotal: parseFloat(stats.inv?.g || '0'),
        outstandingBalance: parseFloat(stats.inv?.b || '0'),
        attendanceToday: {
          present: parseInt(stats.att?.p || '0', 10),
          absent: parseInt(stats.att?.a || '0', 10),
        },
      });
    }
    return {
      schools: out,
      totals: {
        schools: out.length,
        students: out.reduce((a, s) => a + s.students, 0),
        teachers: out.reduce((a, s) => a + s.teachers, 0),
        users: out.reduce((a, s) => a + s.users, 0),
        outstandingBalance: out.reduce((a, s) => a + s.outstandingBalance, 0),
      },
    };
  }
}
