import { Test, TestingModule } from '@nestjs/testing';
import { SectionService, Section } from './section.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

describe('SectionService', () => {
  let service: SectionService;

  const mockDatabaseService = {
    query: jest.fn(),
    queryOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSection: Section = {
    section_id: 1,
    school_id: 1,
    class_id: 1,
    section_name: 'Section A',
    section_code: 'A',
    section_order: 1,
    capacity: 40,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();
    service = module.get<SectionService>(SectionService);
  });

  describe('create', () => {
    const createDto: CreateSectionDto = {
      schoolId: 1,
      classId: 1,
      sectionName: 'Section B',
      sectionCode: 'B',
      sectionOrder: 2,
      capacity: 35,
    };

    it('should create a new section successfully', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue({
        ...mockSection,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['B', 1, 1],
      );
      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if section code already exists', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSection);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use default capacity if not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockSection);

      const dtoWithoutCapacity = { ...createDto };
      delete (dtoWithoutCapacity as any).capacity;
      await service.create(dtoWithoutCapacity);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      expect(insertCall[1][5]).toBe(40);
    });

    it('should use default sectionOrder if not provided', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockSection);

      const dtoWithoutOrder = { ...createDto };
      delete (dtoWithoutOrder as any).sectionOrder;
      await service.create(dtoWithoutOrder);

      const insertCall = mockDatabaseService.insert.mock.calls[0];
      expect(insertCall[1][4]).toBe(0);
    });

    it('should set is_active to true by default', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);
      mockDatabaseService.insert.mockResolvedValue(mockSection);

      await service.create(createDto);

      expect(mockDatabaseService.insert).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all sections for a school', async () => {
      mockDatabaseService.query.mockResolvedValue([mockSection]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM sections'),
        [1],
      );
    });

    it('should return sections filtered by class', async () => {
      mockDatabaseService.query.mockResolvedValue([mockSection]);

      const result = await service.findAll(1, 1);

      expect(result).toHaveLength(1);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('class_id = $2'),
        [1, 1],
      );
    });

    it('should return empty array if no sections', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });

    it('should order by section_order ASC', async () => {
      mockDatabaseService.query.mockResolvedValue([mockSection]);

      await service.findAll(1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY section_order ASC'),
        [1],
      );
    });
  });

  describe('findOne', () => {
    it('should return section by id', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSection);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockSection);
      expect(mockDatabaseService.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE section_id = $1'),
        [1, 1],
      );
    });

    it('should return section by id without schoolId', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSection);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSection);
    });

    it('should throw NotFoundException if section not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateSectionDto = {
      sectionName: 'Updated Section',
      capacity: 50,
    };

    it('should update section fields', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockSection)
        .mockResolvedValueOnce({ ...mockSection, ...updateDto });
      mockDatabaseService.query.mockResolvedValue(null);

      const result = await service.update(1, 1, updateDto);

      expect(result).toBeDefined();
      expect(mockDatabaseService.query).toHaveBeenCalled();
    });

    it('should throw NotFoundException if section not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.update(999, 1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update if no fields provided', async () => {
      mockDatabaseService.queryOne
        .mockResolvedValueOnce(mockSection)
        .mockResolvedValueOnce(mockSection);

      await service.update(1, 1, {});

      expect(mockDatabaseService.query).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete section', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(mockSection);
      mockDatabaseService.query.mockResolvedValue(null);

      await service.remove(1, 1);

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sections SET is_active = false'),
        [1, 1],
      );
    });

    it('should throw NotFoundException if section not found', async () => {
      mockDatabaseService.queryOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
