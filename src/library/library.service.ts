import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm'; // ✅ Import LessThan
import { Book } from './entities/book.entity';
import { BookIssue } from './entities/book-issue.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookIssueDto } from './dto/create-book-issue.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(BookIssue)
    private bookIssueRepository: Repository<BookIssue>,
  ) {}

  // Book Management
  async createBook(createDto: CreateBookDto): Promise<Book> {
    const existing = await this.bookRepository.findOne({
      where: {
        isbn: createDto.isbn,
        schoolId: createDto.schoolId,
        deletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Book with this ISBN already exists at this school',
      );
    }

    const bsDate = NepaliDateUtil.adToBs(createDto.acquisitionDate).bsDate;

    const book = this.bookRepository.create({
      ...createDto,
      schoolId: createDto.schoolId,
      acquisitionDateBs: bsDate,
      totalCopies: createDto.totalCopies || 1,
      issuedCopies: 0,
      damagedCopies: 0,
      currency: createDto.currency || 'NPR',
      isActive: true,
    });

    return this.bookRepository.save(book);
  }

  async findAllBooks(
    schoolId: number,
    bookType?: string,
    subject?: string,
    isSeeReference?: boolean,
    isNebReference?: boolean,
  ): Promise<Book[]> {
    const where: any = { schoolId, isActive: true, deletedAt: IsNull() };
    if (bookType) where.bookType = bookType;
    if (subject) where.subject = subject;
    if (isSeeReference !== undefined) where.isSeeReference = isSeeReference;
    if (isNebReference !== undefined) where.isNebReference = isNebReference;

    return this.bookRepository.find({ where, order: { titleEn: 'ASC' } });
  }

  async findOneBook(id: number, schoolId?: number): Promise<Book> {
    const where: any = { bookId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const book = await this.bookRepository.findOne({
      where,
    });
    if (!book) throw new NotFoundException(`Book with ID ${id} not found`);
    return book;
  }

  async updateBook(
    id: number,
    schoolId: number,
    updateDto: UpdateBookDto,
  ): Promise<Book> {
    const book = await this.findOneBook(id, schoolId);

    // ✅ FIXED: Set BS date directly on ENTITY, not DTO
    if (
      updateDto.acquisitionDate &&
      updateDto.acquisitionDate !== book.acquisitionDate
    ) {
      book.acquisitionDateBs = NepaliDateUtil.adToBs(
        updateDto.acquisitionDate,
      ).bsDate;
    }

    Object.assign(book, updateDto);
    return this.bookRepository.save(book);
  }

  async removeBook(id: number, schoolId: number): Promise<void> {
    await this.findOneBook(id, schoolId);
    const activeIssues = await this.bookIssueRepository.count({
      where: { bookId: id, schoolId, status: 'ISSUED' },
    });
    if (activeIssues > 0) {
      throw new BadRequestException('Cannot delete book with active issues');
    }
    await this.bookRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });
  }

  // Book Issue Management
  async issueBook(createDto: CreateBookIssueDto): Promise<BookIssue> {
    const book = await this.findOneBook(createDto.bookId, createDto.schoolId);

    if (book.issuedCopies >= book.totalCopies) {
      throw new BadRequestException('No copies available for issue');
    }

    const existingIssue = await this.bookIssueRepository.findOne({
      where: {
        bookId: createDto.bookId,
        studentId: createDto.studentId,
        schoolId: createDto.schoolId,
        status: 'ISSUED',
      },
    });
    if (existingIssue) {
      throw new BadRequestException('Student already has this book issued');
    }

    const issueDateBs = NepaliDateUtil.adToBs(createDto.issueDate).bsDate;
    const dueDateBs = NepaliDateUtil.adToBs(createDto.dueDate).bsDate;

    const bookIssue = this.bookIssueRepository.create({
      schoolId: createDto.schoolId,
      bookId: createDto.bookId,
      studentId: createDto.studentId,
      teacherId: createDto.teacherId,
      issueDate: createDto.issueDate,
      issueDateBs,
      dueDate: createDto.dueDate,
      dueDateBs,
      status: 'ISSUED',
      fineAmount: 0,
      daysOverdue: 0,
    });

    book.issuedCopies += 1;
    await this.bookRepository.save(book);

    return this.bookIssueRepository.save(bookIssue);
  }

  async returnBook(
    issueId: number,
    schoolId: number,
    returnDto: ReturnBookDto,
  ): Promise<BookIssue> {
    const bookIssue = await this.bookIssueRepository.findOne({
      where: { issueId, schoolId },
    });
    if (!bookIssue) {
      throw new NotFoundException(
        `Book issue with ID ${returnDto.issueId} not found`,
      );
    }
    if (bookIssue.status === 'RETURNED') {
      throw new BadRequestException('Book already returned');
    }

    const today = new Date();
    const dueDate = new Date(bookIssue.dueDate);
    const daysOverdue =
      returnDto.daysOverdue ||
      Math.max(
        0,
        Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

    const finePerDay = 5;
    const fineAmount = returnDto.fineAmount || daysOverdue * finePerDay;

    bookIssue.returnDate = today;
    bookIssue.returnDateBs = NepaliDateUtil.adToBs(today).bsDate;
    bookIssue.fineAmount = fineAmount;
    bookIssue.daysOverdue = daysOverdue;
    bookIssue.status = 'RETURNED';
    bookIssue.remarks = `Returned after ${daysOverdue} days overdue. Fine: NPR ${fineAmount}`;

    const book = await this.findOneBook(bookIssue.bookId, schoolId);
    book.issuedCopies = Math.max(0, book.issuedCopies - 1);
    await this.bookRepository.save(book);

    return this.bookIssueRepository.save(bookIssue);
  }

  async getStudentIssuedBooks(
    studentId: number,
    schoolId: number,
  ): Promise<BookIssue[]> {
    return this.bookIssueRepository.find({
      where: { studentId, schoolId, status: 'ISSUED' },
      order: { issueDate: 'DESC' },
    });
  }

  async getOverdueBooks(schoolId: number): Promise<BookIssue[]> {
    const today = new Date();
    // ✅ FIXED: Use LessThan operator instead of MongoDB-style $lt
    return this.bookIssueRepository.find({
      where: {
        schoolId,
        dueDate: LessThan(today),
        status: 'ISSUED',
      },
      order: { dueDate: 'ASC' },
    });
  }

  // Nepal-specific: Get SEE/NEB reference books
  async getSeeReferenceBooks(schoolId: number): Promise<Book[]> {
    return this.bookRepository.find({
      where: {
        schoolId,
        isSeeReference: true,
        isActive: true,
        deletedAt: IsNull(),
      },
      order: { subject: 'ASC', curriculumLevel: 'ASC' },
    });
  }

  async getNebReferenceBooks(schoolId: number): Promise<Book[]> {
    return this.bookRepository.find({
      where: {
        schoolId,
        isNebReference: true,
        isActive: true,
        deletedAt: IsNull(),
      },
      order: { subject: 'ASC', curriculumLevel: 'ASC' },
    });
  }

  // Generate fine receipt in NPR format
  async generateFineReceipt(issueId: number, schoolId: number): Promise<any> {
    const bookIssue = await this.bookIssueRepository.findOne({
      where: { issueId, schoolId },
    });
    if (!bookIssue || bookIssue.status !== 'RETURNED') {
      throw new NotFoundException('Book issue not found or not returned');
    }

    const book = await this.findOneBook(bookIssue.bookId, schoolId);

    return {
      issueId: bookIssue.issueId,
      bookTitle: book.titleEn,
      bookTitleNp: book.titleNp || book.titleEn,
      issueDate: bookIssue.issueDate,
      issueDateBs: bookIssue.issueDateBs,
      returnDate: bookIssue.returnDate,
      returnDateBs: bookIssue.returnDateBs,
      daysOverdue: bookIssue.daysOverdue,
      fineAmount: bookIssue.fineAmount,
      fineAmountNpr: NepaliNumberUtil.formatCurrency(
        bookIssue.fineAmount,
        'en',
      ),
      fineAmountNprNp: NepaliNumberUtil.formatCurrency(
        bookIssue.fineAmount,
        'ne',
      ),
      paymentStatus: 'PENDING',
    };
  }
}
