import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

describe('AttendanceController', () => {
  let controller: AttendanceController;

  const mockService = {
    create: jest.fn(),
    createBulk: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByStudent: jest.fn(),
    getStudentStatistics: jest.fn(),
    getMonthlyReport: jest.fn(),
    isNepalHoliday: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [{ provide: AttendanceService, useValue: mockService }],
    }).compile();
    controller = module.get<AttendanceController>(AttendanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
