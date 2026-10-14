import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookIssueDto } from './dto/create-book-issue.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

export interface Book {
  book_id: number;
  school_id: number;
  isbn: string | null;
  book_code: string | null;
  title_en: string;
  title_np: string | null;
  author: string | null;
  author_np: string | null;
  publisher: string | null;
  publisher_np: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  issued_copies: number | null;
  price: number | null;
  currency: string | null;
  rack_number: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface BookIssue {
  issue_id: number;
  school_id: number;
  book_id: number;
  student_id: number;
  teacher_id: number | null;
  issue_date: Date;
  issue_date_bs: string | null;
  due_date: Date;
  due_date_bs: string | null;
  return_date: Date | null;
  return_date_bs: string | null;
  fine_amount: number;
  days_overdue: number;
  status: string;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class LibraryService {
  constructor(private db: DatabaseService) {}

  async createBook(createDto: CreateBookDto): Promise<Book> {
    const existing = await this.db.queryOne<Book>(
      `SELECT book_id FROM books WHERE isbn = $1 AND school_id = $2 AND deleted_at IS NULL`,
      [createDto.isbn, createDto.schoolId],
    );
    if (existing) {
      throw new BadRequestException(
        'Book with this ISBN already exists at this school',
      );
    }

    const result = await this.db.insert<Book>(
      `INSERT INTO books (school_id, isbn, book_code, title, title_en, author, publisher, category, total_copies, available_copies, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.isbn,
        createDto.bookCode,
        createDto.titleEn,
        createDto.titleEn,
        createDto.authorEn,
        createDto.publisherEn,
        createDto.bookType,
        createDto.totalCopies,
        createDto.totalCopies,
      ],
    );

    return result;
  }

  async findAllBooks(
    schoolId: number,
    bookType?: string,
    subject?: string,
    isSeeReference?: boolean,
    isNebReference?: boolean,
  ): Promise<Book[]> {
    let query = `SELECT * FROM books WHERE school_id = $1 AND is_active = true AND deleted_at IS NULL`;
    const params: any[] = [schoolId];

    if (bookType) {
      params.push(bookType);
      query += ` AND book_type = $${params.length}`;
    }
    if (isSeeReference !== undefined) {
      params.push(isSeeReference);
      query += ` AND is_see_reference = $${params.length}`;
    }
    if (isNebReference !== undefined) {
      params.push(isNebReference);
      query += ` AND is_neb_reference = $${params.length}`;
    }

    query += ` ORDER BY title ASC`;

    return this.db.query<Book>(query, params);
  }

  async findOneBook(id: number, schoolId?: number): Promise<Book> {
    let query = `SELECT * FROM books WHERE book_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      query += ` AND school_id = $${params.length}`;
    }

    const book = await this.db.queryOne<Book>(query, params);
    if (!book) throw new NotFoundException(`Book with ID ${id} not found`);
    return book;
  }

  async updateBook(
    id: number,
    schoolId: number,
    updateDto: UpdateBookDto,
  ): Promise<Book> {
    await this.findOneBook(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: { [key: string]: string } = {
      titleEn: 'title_en',
      title: 'title',
      titleNp: 'title_np',
      authorEn: 'author',
      authorNp: 'author_np',
      publisherEn: 'publisher',
      publisherNp: 'publisher_np',
      isbn: 'isbn',
      bookCode: 'book_code',
      subject: 'subject',
      bookType: 'category',
      price: 'price',

      totalCopies: 'total_copies',
    };

    for (const [dtoField, dbField] of Object.entries(fieldMap)) {
      if ((updateDto as any)[dtoField] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        params.push((updateDto as any)[dtoField]);
        paramIndex++;
      }
    }

    if (updates.length === 0) return this.findOneBook(id, schoolId);

    params.push(id);
    await this.db.update(
      `UPDATE books SET ${updates.join(', ')} WHERE book_id = $${paramIndex}`,
      params,
    );

    return this.findOneBook(id, schoolId);
  }

  async removeBook(id: number, schoolId: number): Promise<void> {
    await this.findOneBook(id, schoolId);
    const activeIssues = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM book_issues WHERE book_id = $1 AND school_id = $2 AND status = 'ISSUED'`,
      [id, schoolId],
    );
    if (activeIssues && parseInt(activeIssues.count) > 0) {
      throw new BadRequestException('Cannot delete book with active issues');
    }
    await this.db.update(
      `UPDATE books SET is_active = false, deleted_at = NOW() WHERE book_id = $1`,
      [id],
    );
  }

  async issueBook(createDto: CreateBookIssueDto): Promise<BookIssue> {
    const book = await this.findOneBook(createDto.bookId, createDto.schoolId);

    if ((book.available_copies ?? 0) <= 0) {
      throw new BadRequestException('No copies available for issue');
    }

    const existingIssue = await this.db.queryOne<BookIssue>(
      `SELECT issue_id FROM book_issues 
       WHERE book_id = $1 AND student_id = $2 AND school_id = $3 AND status = 'ISSUED'`,
      [createDto.bookId, createDto.studentId, createDto.schoolId],
    );
    if (existingIssue) {
      throw new BadRequestException('Student already has this book issued');
    }

    // BS dates come from the frontend — the backend stores them as given.
    const issueDateBs = createDto.issueDateBs || null;
    const dueDateBs = createDto.dueDateBs || null;

    const result = await this.db.insert<BookIssue>(
      `INSERT INTO book_issues (
        school_id, book_id, student_id, teacher_id, issue_date, issue_date_bs,
        due_date, due_date_bs, status, fine_amount, days_overdue
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.bookId,
        createDto.studentId,
        createDto.teacherId || null,
        createDto.issueDate,
        issueDateBs,
        createDto.dueDate,
        dueDateBs,
        'ISSUED',
        0,
        0,
      ],
    );

    await this.db.update(
      `UPDATE books SET available_copies = GREATEST(available_copies - 1, 0) WHERE book_id = $1`,
      [createDto.bookId],
    );

    return result;
  }

  async returnBook(
    issueId: number,
    schoolId: number,
    returnDto: ReturnBookDto,
  ): Promise<BookIssue> {
    const bookIssue = await this.db.queryOne<BookIssue>(
      `SELECT * FROM book_issues WHERE issue_id = $1 AND school_id = $2`,
      [issueId, schoolId],
    );
    if (!bookIssue) {
      throw new NotFoundException(
        `Book issue with ID ${returnDto.issueId} not found`,
      );
    }
    if (bookIssue.status === 'RETURNED') {
      throw new BadRequestException('Book already returned');
    }

    const returnDate = returnDto.returnDate
      ? new Date(returnDto.returnDate)
      : new Date();
    const dueDate = new Date(bookIssue.due_date);
    const daysOverdue =
      returnDto.daysOverdue ||
      Math.max(
        0,
        Math.floor(
          (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

    const finePerDay = 5;
    const fineAmount = returnDto.fineAmount || daysOverdue * finePerDay;

    // BS date comes from the frontend — the backend stores it as given.
    const returnDateBs = returnDto.returnDateBs || null;
    const remarks = `Returned after ${daysOverdue} days overdue. Fine: NPR ${fineAmount}`;

    const result = await this.db.insert<BookIssue>(
      `UPDATE book_issues SET 
        return_date = $1, return_date_bs = $2, fine_amount = $3, 
        days_overdue = $4, status = $5, remarks = $6
      WHERE issue_id = $7
      RETURNING *`,
      [
        returnDate,
        returnDateBs,
        fineAmount,
        daysOverdue,
        'RETURNED',
        remarks,
        issueId,
      ],
    );

    await this.db.update(
      `UPDATE books SET available_copies = LEAST(available_copies + 1, total_copies) WHERE book_id = $1`,
      [bookIssue.book_id],
    );

    return result;
  }

  async getStudentIssuedBooks(
    studentId: number,
    schoolId: number,
  ): Promise<BookIssue[]> {
    return this.db.query<BookIssue>(
      `SELECT * FROM book_issues WHERE student_id = $1 AND school_id = $2 AND status = 'ISSUED' ORDER BY issue_date DESC`,
      [studentId, schoolId],
    );
  }

  async getOverdueBooks(schoolId: number): Promise<BookIssue[]> {
    const today = new Date();
    return this.db.query<BookIssue>(
      `SELECT * FROM book_issues WHERE school_id = $1 AND due_date < $2 AND status = 'ISSUED' ORDER BY due_date ASC`,
      [schoolId, today],
    );
  }

  async getSeeReferenceBooks(schoolId: number): Promise<Book[]> {
    return this.db.query<Book>(
      `SELECT * FROM books WHERE school_id = $1 AND is_see_reference = true AND is_active = true AND deleted_at IS NULL ORDER BY title_en ASC`,
      [schoolId],
    );
  }

  async getNebReferenceBooks(schoolId: number): Promise<Book[]> {
    return this.db.query<Book>(
      `SELECT * FROM books WHERE school_id = $1 AND is_neb_reference = true AND is_active = true AND deleted_at IS NULL ORDER BY title_en ASC`,
      [schoolId],
    );
  }

  async generateFineReceipt(issueId: number, schoolId: number): Promise<any> {
    const bookIssue = await this.db.queryOne<BookIssue>(
      `SELECT * FROM book_issues WHERE issue_id = $1 AND school_id = $2`,
      [issueId, schoolId],
    );
    if (!bookIssue || bookIssue.status !== 'RETURNED') {
      throw new NotFoundException('Book issue not found or not returned');
    }

    const book = await this.findOneBook(bookIssue.book_id, schoolId);

    return {
      issueId: bookIssue.issue_id,
      bookTitle: book.title_en,
      bookTitleNp: book.title_np || book.title_en,
      issueDate: bookIssue.issue_date,
      issueDateBs: bookIssue.issue_date_bs,
      returnDate: bookIssue.return_date,
      returnDateBs: bookIssue.return_date_bs,
      daysOverdue: bookIssue.days_overdue,
      fineAmount: bookIssue.fine_amount,
      fineAmountNpr: NepaliNumberUtil.formatCurrency(
        bookIssue.fine_amount,
        'en',
      ),
      fineAmountNprNp: NepaliNumberUtil.formatCurrency(
        bookIssue.fine_amount,
        'ne',
      ),
      paymentStatus: 'PENDING',
    };
  }
}
