import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { DatabaseService } from '../database/database.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Check system health',
    description:
      'Verifies database connectivity, memory usage, and disk space.',
  })
  async check() {
    const dbHealthy = await this.db.queryOne<{ result: string }>(
      'SELECT 1 as result',
    );

    return this.health.check([
      () => ({
        database: {
          status: dbHealthy?.result ? 'up' : 'down',
          message: dbHealthy?.result
            ? 'Database connected'
            : 'Database not responding',
        },
      }),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.95,
        }),
    ]);
  }
}
