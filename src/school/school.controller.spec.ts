import { Test, TestingModule } from '@nestjs/testing';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';

describe('SchoolController', () => {
  let controller: SchoolController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getSchoolWithNepaliDate: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolController],
      providers: [
        { provide: SchoolService, useValue: mockService },
        { provide: 'CACHE_MANAGER', useValue: mockCacheManager },
      ],
    }).compile();
    controller = module.get<SchoolController>(SchoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
