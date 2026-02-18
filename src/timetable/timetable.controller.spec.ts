import { Test, TestingModule } from '@nestjs/testing';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

describe('TimetableController', () => {
  let controller: TimetableController;
  let service: TimetableService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getWeeklyTimetable: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimetableController],
      providers: [{ provide: TimetableService, useValue: mockService }],
    }).compile();
    controller = module.get<TimetableController>(TimetableController);
    service = module.get<TimetableService>(TimetableService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
