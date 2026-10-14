import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface AuditLog {
  audit_log_id: number;
  school_id: number | null;
  user_id: number | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  description: string | null;
  created_at: Date;
}

export interface CreateAuditLogDto {
  schoolId?: number;
  userId?: number;
  userName?: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW'
    | 'EXPORT';
  entityType: string;
  entityId?: number;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

export interface AuditLogQueryDto {
  schoolId?: number;
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private db: DatabaseService) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const result = await this.db.insert<AuditLog>(
      `INSERT INTO audit_logs (school_id, user_id, user_name, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        dto.schoolId || null,
        dto.userId || null,
        dto.userName || null,
        dto.action,
        dto.entityType,
        dto.entityId || null,
        dto.oldValue ? JSON.stringify(dto.oldValue) : null,
        dto.newValue ? JSON.stringify(dto.newValue) : null,
        dto.ipAddress || null,
        dto.userAgent || null,
        dto.description || null,
      ],
    );
    return result[0];
  }

  async findAll(
    query: AuditLogQueryDto,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (query.schoolId) {
      conditions.push(`school_id = $${paramIndex++}`);
      params.push(query.schoolId);
    }
    if (query.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(query.userId);
    }
    if (query.entityType) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(query.entityType);
    }
    if (query.entityId) {
      conditions.push(`entity_id = $${paramIndex++}`);
      params.push(query.entityId);
    }
    if (query.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(query.action);
    }
    if (query.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(query.startDate);
    }
    if (query.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(query.endDate);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const countResult = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params,
    );
    const total = parseInt(countResult?.count || '0', 10);

    const data = await this.db.query<AuditLog>(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset],
    );

    return { data, total };
  }

  async findById(id: number, schoolId?: number): Promise<AuditLog | null> {
    return this.db.queryOne<AuditLog>(
      schoolId
        ? `SELECT * FROM audit_logs WHERE id = $1 AND school_id = $2`
        : `SELECT * FROM audit_logs WHERE id = $1`,
      schoolId ? [id, schoolId] : [id],
    );
  }

  async findByEntity(
    entityType: string,
    entityId: number,
    schoolId?: number,
  ): Promise<AuditLog[]> {
    return this.db.query<AuditLog>(
      schoolId
        ? `SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 AND school_id = $3 ORDER BY created_at DESC`
        : `SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC`,
      schoolId ? [entityType, entityId, schoolId] : [entityType, entityId],
    );
  }

  async findByUser(
    userId: number,
    limit = 50,
    schoolId?: number,
  ): Promise<AuditLog[]> {
    return this.db.query<AuditLog>(
      schoolId
        ? `SELECT * FROM audit_logs WHERE user_id = $1 AND school_id = $2 ORDER BY created_at DESC LIMIT $3`
        : `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      schoolId ? [userId, schoolId, limit] : [userId, limit],
    );
  }

  async getActivitySummary(
    schoolId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{ action: string; count: number }[]> {
    const conditions: string[] = ['school_id = $1'];
    const params: unknown[] = [schoolId];

    if (startDate) {
      conditions.push('created_at >= $2');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(startDate ? 'created_at <= $3' : 'created_at <= $2');
      params.push(endDate);
    }

    const result = await this.db.query<{ action: string; count: string }>(
      `SELECT action, COUNT(*) as count FROM audit_logs WHERE ${conditions.join(' AND ')} GROUP BY action ORDER BY count DESC`,
      params,
    );

    return result.map((r) => ({
      action: r.action,
      count: parseInt(r.count, 10),
    }));
  }
}
