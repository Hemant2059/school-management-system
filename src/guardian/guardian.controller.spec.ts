import { Test, TestingModule } from '@nestjs/testing';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';

describe('GuardianController', () => {
  let controller: GuardianController;
  let service: GuardianService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getGuardianWithDetails: jest.fn(),
    findByMobile: jest.fn(),
    searchGuardians: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardianController],
      providers: [{ provide: GuardianService, useValue: mockService }],
    }).compile();
    controller = module.get<GuardianController>(GuardianController);
    service = module.get<GuardianService>(GuardianService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
