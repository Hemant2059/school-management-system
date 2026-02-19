import { Test, TestingModule } from '@nestjs/testing';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';

describe('FeeController', () => {
  let controller: FeeController;

  const mockService = {
    createFeeCategory: jest.fn(),
    findAllFeeCategories: jest.fn(),
    createFeeStructure: jest.fn(),
    getFeeStructureForClass: jest.fn(),
    createStudentFee: jest.fn(),
    getStudentFees: jest.fn(),
    processPayment: jest.fn(),
    generateReceipt: jest.fn(),
    getOverdueFees: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeeController],
      providers: [{ provide: FeeService, useValue: mockService }],
    }).compile();
    controller = module.get<FeeController>(FeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
