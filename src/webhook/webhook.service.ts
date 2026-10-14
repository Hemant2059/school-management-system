import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Webhook {
  id: number;
  school_id: number;
  webhook_type: string;
  name: string;
  url: string;
  secret_key: string | null;
  is_active: boolean;
  events: string[];
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookLog {
  log_id: number;
  id: number;
  event_type: string;
  payload: Record<string, unknown> | null;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  retry_count: number;
  delivered_at: Date | null;
  created_at: Date;
}

@Injectable()
export class WebhookService {
  constructor(private db: DatabaseService) {}

  async createWebhook(
    schoolId: number,
    webhookType: string,
    name: string,
    url: string,
    events: string[],
    createdBy?: number,
    secretKey?: string,
  ): Promise<Webhook> {
    return this.db.insert<Webhook>(
      `INSERT INTO webhooks (school_id, webhook_type, name, url, secret_key, events, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        schoolId,
        webhookType,
        name,
        url,
        secretKey || null,
        JSON.stringify(events),
        createdBy || null,
      ],
    );
  }

  private parseEvents<T extends { events: any }>(row: T): T {
    if (row && typeof (row as any).events === 'string') {
      try {
        (row as any).events = JSON.parse((row as any).events);
      } catch {
        (row as any).events = [];
      }
    }
    return row;
  }

  async getWebhooks(schoolId: number, type?: string): Promise<Webhook[]> {
    let query = `SELECT * FROM webhooks WHERE school_id = $1 AND is_active = true`;
    const params: any[] = [schoolId];

    if (type) {
      query += ` AND webhook_type = $2`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = await this.db.query<Webhook>(query, params);
    return rows.map((r) => this.parseEvents(r));
  }

  async getWebhookById(webhookId: number, schoolId: number): Promise<Webhook> {
    const webhook = await this.db.queryOne<Webhook>(
      `SELECT * FROM webhooks WHERE id = $1 AND school_id = $2`,
      [webhookId, schoolId],
    );

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return this.parseEvents(webhook);
  }

  async updateWebhook(
    webhookId: number,
    schoolId: number,
    updates: {
      name?: string;
      url?: string;
      events?: string[];
      isActive?: boolean;
    },
  ): Promise<Webhook> {
    await this.getWebhookById(webhookId, schoolId);

    await this.db.query(
      `UPDATE webhooks SET 
        name = COALESCE($2, name),
        url = COALESCE($3, url),
        events = COALESCE($4, events),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
       WHERE id = $1 AND school_id = $6`,
      [
        webhookId,
        updates.name || null,
        updates.url || null,
        updates.events ? JSON.stringify(updates.events) : null,
        updates.isActive ?? null,
        schoolId,
      ],
    );

    return this.getWebhookById(webhookId, schoolId);
  }

  async deleteWebhook(webhookId: number, schoolId: number): Promise<void> {
    await this.getWebhookById(webhookId, schoolId);

    await this.db.query(
      `UPDATE webhooks SET is_active = false, updated_at = NOW() WHERE id = $1 AND school_id = $2`,
      [webhookId, schoolId],
    );
  }

  async logWebhookDelivery(
    webhookId: number,
    eventType: string,
    payload: Record<string, unknown>,
    responseStatus?: number,
    responseBody?: string,
    success?: boolean,
  ): Promise<WebhookLog> {
    return this.db.insert<WebhookLog>(
      `INSERT INTO webhook_logs (webhook_id, event_type, payload, response_status, response_body, success)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        webhookId,
        eventType,
        JSON.stringify(payload),
        responseStatus || null,
        responseBody || null,
        success ?? false,
      ],
    );
  }

  async getWebhookLogs(
    webhookId: number,
    schoolId: number,
  ): Promise<WebhookLog[]> {
    await this.getWebhookById(webhookId, schoolId);

    return this.db.query<WebhookLog>(
      `SELECT * FROM webhook_logs WHERE webhook_id = $1 ORDER BY attempted_at DESC, created_at DESC LIMIT 100`,
      [webhookId],
    );
  }

  async triggerWebhook(
    schoolId: number,
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<{ triggered: number; failed: number }> {
    const webhooks = await this.db.query<Webhook>(
      `SELECT * FROM webhooks WHERE school_id = $1 AND is_active = true 
       AND events::jsonb ? $2`,
      [schoolId, eventType],
    );

    let triggered = 0;
    let failed = 0;

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': eventType,
            'X-Webhook-Secret': webhook.secret_key || '',
          },
          body: JSON.stringify(data),
        });

        await this.logWebhookDelivery(
          webhook.id,
          eventType,
          data,
          response.status,
          await response.text().catch(() => ''),
          response.ok,
        );

        if (response.ok) triggered++;
        else failed++;
      } catch (error) {
        failed++;
        await this.logWebhookDelivery(
          webhook.id,
          eventType,
          data,
          0,
          error.message,
          false,
        );
      }
    }

    return { triggered, failed };
  }
}
