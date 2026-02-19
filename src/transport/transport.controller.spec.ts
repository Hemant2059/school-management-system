import { Test, TestingModule } from '@nestjs/testing';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';

describe('TransportController', () => {
  let controller: TransportController;

  const mockService = {
    createVehicle: jest.fn(),
    findAllVehicles: jest.fn(),
    createRoute: jest.fn(),
    createRouteStop: jest.fn(),
    getRouteWithStops: jest.fn(),
    getRoutesByDistrict: jest.fn(),
    assignStudentToTransport: jest.fn(),
    getStudentTransport: jest.fn(),
    getRouteAssignments: jest.fn(),
    setRouteFee: jest.fn(),
    getRouteFee: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportController],
      providers: [{ provide: TransportService, useValue: mockService }],
    }).compile();
    controller = module.get<TransportController>(TransportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
