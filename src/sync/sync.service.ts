import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface SyncQueue {
  sync_id: number;
  school_id: number;
  device_id: string | null;
  entity_type: string;
  entity_id: number;
  operation: string;
  data: Record<string, unknown> | null;
  status: string;
  retry_count: number;
  error_message: string | null;
  synced_at: Date | null;
  created_at: Date;
}

export interface SyncLog {
  log_id: number;
  school_id: number;
  device_id: string | null;
  operation: string;
  entity_type: string | null;
  entity_id: number | null;
  success: boolean;
  error_message: string | null;
  created_at: Date;
}

export interface SyncPushDto {
  schoolId: number;
  deviceId?: string;
  changes: {
    entityType: string;
    entityId: number;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data?: Record<string, unknown>;
  }[];
  lastSyncTimestamp?: string;
}

@Injectable()
export class SyncService {
  constructor(private db: DatabaseService) {}

  async pushChanges(
    dto: SyncPushDto,
  ): Promise<{ synced: number; failed: number; results: any[] }> {
    const results: any[] = [];
    let synced = 0;
    let failed = 0;

    for (const change of dto.changes) {
      try {
        await this.db.insert<SyncQueue>(
          `INSERT INTO sync_queue (school_id, device_id, entity_type, entity_id, operation, data, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
           RETURNING *`,
          [
            dto.schoolId,
            dto.deviceId || null,
            change.entityType,
            change.entityId,
            change.operation,
            change.data ? JSON.stringify(change.data) : null,
          ],
        );

        await this.db.insert<SyncLog>(
          `INSERT INTO sync_log (school_id, device_id, operation, entity_type, entity_id, success)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [
            dto.schoolId,
            dto.deviceId || null,
            change.operation,
            change.entityType,
            change.entityId,
          ],
        );

        results.push({
          entityType: change.entityType,
          entityId: change.entityId,
          status: 'queued',
        });
        synced++;
      } catch (error) {
        failed++;
        results.push({
          entityType: change.entityType,
          entityId: change.entityId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return { synced, failed, results };
  }

  async pullChanges(
    schoolId: number,
    deviceId: string,
    entityTypes?: string[],
    since?: string,
  ): Promise<{ data: any[]; timestamp: string }> {
    let query = `SELECT * FROM sync_queue WHERE school_id = $1 AND status = 'PENDING'`;
    const params: any[] = [schoolId];

    if (since) {
      query += ` AND created_at > $${params.length + 1}`;
      params.push(since);
    }

    if (entityTypes && entityTypes.length > 0) {
      query += ` AND entity_type = ANY($${params.length + 1})`;
      params.push(entityTypes);
    }

    query += ` ORDER BY created_at ASC LIMIT 1000`;

    const changes = await this.db.query<SyncQueue>(query, params);

    return {
      data: changes,
      timestamp: new Date().toISOString(),
    };
  }

  async acknowledge(schoolId: number, syncIds: number[]): Promise<void> {
    if (syncIds.length === 0) return;

    await this.db.query(
      `UPDATE sync_queue SET status = 'COMPLETED', synced_at = NOW() WHERE sync_id = ANY($1) AND school_id = $2`,
      [syncIds, schoolId],
    );
  }

  async getPendingChanges(schoolId: number): Promise<SyncQueue[]> {
    return this.db.query<SyncQueue>(
      `SELECT * FROM sync_queue WHERE school_id = $1 AND status = 'PENDING' ORDER BY created_at ASC`,
      [schoolId],
    );
  }

  async retryFailed(schoolId: number, syncId: number): Promise<SyncQueue> {
    await this.db.query(
      `UPDATE sync_queue SET status = 'PENDING', retry_count = retry_count + 1 WHERE sync_id = $1 AND school_id = $2`,
      [syncId, schoolId],
    );

    const result = await this.db.queryOne<SyncQueue>(
      `SELECT * FROM sync_queue WHERE sync_id = $1`,
      [syncId],
    );
    if (!result) {
      throw new BadRequestException('Sync record not found');
    }
    return result;
  }

  async getSyncStatus(
    schoolId: number,
    deviceId?: string,
  ): Promise<{ pending: number; completed: number; failed: number }> {
    const query = deviceId
      ? `SELECT status, COUNT(*) as count FROM sync_queue WHERE school_id = $1 AND device_id = $2 GROUP BY status`
      : `SELECT status, COUNT(*) as count FROM sync_queue WHERE school_id = $1 GROUP BY status`;

    const params = deviceId ? [schoolId, deviceId] : [schoolId];
    const result = await this.db.query<{ status: string; count: string }>(
      query,
      params,
    );

    const status = { pending: 0, completed: 0, failed: 0 };
    result.forEach((r) => {
      if (r.status === 'PENDING') status.pending = parseInt(r.count, 10);
      else if (r.status === 'COMPLETED')
        status.completed = parseInt(r.count, 10);
      else if (r.status === 'FAILED') status.failed = parseInt(r.count, 10);
    });

    return status;
  }
}
