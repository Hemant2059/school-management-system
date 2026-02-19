import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService } from '@nestjs/terminus';
import { MemoryHealthIndicator } from '@nestjs/terminus';
import { DiskHealthIndicator } from '@nestjs/terminus';
import { DatabaseService } from '../database/database.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    check: jest.fn(),
  };

  const mockDb = {
    queryOne: jest.fn().mockResolvedValue({ result: '1' }),
  };
  const mockMemory = { checkHeap: jest.fn(), checkRSS: jest.fn() };
  const mockDisk = { checkStorage: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthService },
        { provide: DatabaseService, useValue: mockDb },
        { provide: MemoryHealthIndicator, useValue: mockMemory },
        { provide: DiskHealthIndicator, useValue: mockDisk },
      ],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
