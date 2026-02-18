import { Test, TestingModule } from '@nestjs/testing';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

describe('LibraryController', () => {
  let controller: LibraryController;
  let service: LibraryService;

  const mockService = {
    createBook: jest.fn(),
    findAllBooks: jest.fn(),
    getSeeReferenceBooks: jest.fn(),
    getNebReferenceBooks: jest.fn(),
    findOneBook: jest.fn(),
    updateBook: jest.fn(),
    removeBook: jest.fn(),
    issueBook: jest.fn(),
    returnBook: jest.fn(),
    getStudentIssuedBooks: jest.fn(),
    getOverdueBooks: jest.fn(),
    generateFineReceipt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LibraryController],
      providers: [{ provide: LibraryService, useValue: mockService }],
    }).compile();
    controller = module.get<LibraryController>(LibraryController);
    service = module.get<LibraryService>(LibraryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
