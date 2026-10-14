import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DocumentService templates', () => {
  let service: DocumentService;

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
        DocumentService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = module.get<DocumentService>(DocumentService);
  });

  describe('createTemplate', () => {
    it('should store EN+NP verbatim', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.query.mockResolvedValue([{ id: 1 }]);
      const result = await service.createTemplate(1, {
        name: 'Bonafide',
        nameNp: 'बोनाफाइड',
        templateContent: 'Hello',
        templateContentNp: 'नमस्ते',
      });
      expect(result.id).toBe(1);
      expect(mockDatabaseService.query.mock.calls[0][1]).toContain('बोनाफाइड');
    });

    it('should reject duplicate name per school', async () => {
      mockDatabaseService.queryOne.mockResolvedValue({ id: 9 });
      await expect(
        service.createTemplate(1, { name: 'Bonafide' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTemplate', () => {
    it('should return existing when nothing to update', async () => {
      mockDatabaseService.query.mockResolvedValueOnce([{ id: 1 }]);
      const result = await service.updateTemplate(1, 1, {});
      expect(result.id).toBe(1);
    });

    it('should throw for missing template', async () => {
      mockDatabaseService.query.mockResolvedValue([]);
      await expect(
        service.updateTemplate(1, 1, { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTemplate', () => {
    it('should soft-delete', async () => {
      mockDatabaseService.query.mockResolvedValue([{ id: 1 }]);
      await service.deleteTemplate(1, 1);
      expect(mockDatabaseService.query.mock.calls[0][0]).toContain(
        'is_active = false',
      );
    });
  });
});
