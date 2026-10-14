import { Test, TestingModule } from '@nestjs/testing';
import { TransportService } from './transport.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TransportService updates + deletes', () => {
  let service: TransportService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<TransportService>(TransportService);
  });

  describe('updateVehicle', () => {
    it('should throw for missing vehicle', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      await expect(
        service.updateVehicle(1, 1, { colorNp: 'पहेंलो' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields incl. NP twins', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ vehicle_id: 1 });
      mockDatabaseService.insert.mockResolvedValue({ vehicle_id: 1 });
      await service.updateVehicle(1, 1, {
        colorNp: 'पहेंलो',
        insuranceExpiryBs: '2083-09-16',
      });
      const [sql, params] = mockDatabaseService.insert.mock.calls[0];
      expect(sql).toContain('color_np = $1');
      expect(sql).toContain('insurance_expiry_bs = $2');
      expect(params).toEqual(['पहेंलो', '2083-09-16', 1]);
    });
  });

  describe('deleteVehicle', () => {
    it('should block while active assignments exist', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ count: '1' });
      await expect(service.deleteVehicle(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should soft-delete when unused', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ count: '0' });
      mockDatabaseService.update.mockResolvedValue(1);
      await service.deleteVehicle(1, 1);
      expect(mockDatabaseService.update.mock.calls[0][0]).toContain(
        'deleted_at = NOW()',
      );
    });
  });

  describe('updateRoute', () => {
    it('should persist NP twins verbatim', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ route_id: 1 });
      mockDatabaseService.insert.mockResolvedValue({ route_id: 1 });
      await service.updateRoute(1, 1, {
        routeNameNp: 'बानेश्वर रुट',
        startPointNp: 'क',
      } as any);
      const params = mockDatabaseService.insert.mock.calls[0][1];
      expect(params).toContain('बानेश्वर रुट');
      expect(params).toContain('क');
    });
  });

  describe('deleteRoute', () => {
    it('should block while stops exist', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce({ count: '0' })
        .mockResolvedValueOnce({ count: '2' });
      await expect(service.deleteRoute(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
