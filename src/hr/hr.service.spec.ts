import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from './hr.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { Payroll } from './entities/payroll.entity';
import { LeaveType } from './entities/leave-type.entity';
import { LeaveRequest } from './entities/leave-request.entity';

describe('HrService', () => {
  let service: HrService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        {
          provide: getRepositoryToken(Staff),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Payroll),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(LeaveType),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(LeaveRequest),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
