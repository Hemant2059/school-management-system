import { Test, TestingModule } from '@nestjs/testing';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

describe('HrController', () => {
  let controller: HrController;

  const mockService = {
    createStaff: jest.fn(),
    findAllStaff: jest.fn(),
    findOneStaff: jest.fn(),
    processPayroll: jest.fn(),
    getStaffPayroll: jest.fn(),
    generatePayslip: jest.fn(),
    createLeaveRequest: jest.fn(),
    approveLeaveRequest: jest.fn(),
    rejectLeaveRequest: jest.fn(),
    getNepalHolidays: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrController],
      providers: [{ provide: HrService, useValue: mockService }],
    }).compile();
    controller = module.get<HrController>(HrController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
