import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { CreateBookIssueDto } from './dto/create-book-issue.dto';
import { ReturnBookDto } from './dto/return-book.dto';

@ApiTags('Library Management')
@ApiBearerAuth()
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // Books
  @Post('books')
  @ApiOperation({
    summary: 'Add new book',
    description:
      'Add a new book to the library collection with bilingual support.',
  })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({
    status: 201,
    description: 'Book added successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  createBook(@Body() createDto: CreateBookDto) {
    return this.libraryService.createBook(createDto);
  }

  @Get('books')
  @ApiOperation({
    summary: 'Get all books',
    description:
      'Retrieve library books with optional filters for type, subject, and reference status.',
  })
  @ApiQuery({
    name: 'bookType',
    description: 'Book type filter',
    example: 'TEXTBOOK',
    enum: [
      'TEXTBOOK',
      'REFERENCE',
      'NOVEL',
      'ENCYCLOPEDIA',
      'MAGAZINE',
      'OTHER',
    ],
    required: false,
  })
  @ApiQuery({
    name: 'subject',
    description: 'Subject filter',
    example: 'Mathematics',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'isSeeReference',
    description: 'Filter SEE reference books (true/false)',
    example: 'true',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'isNebReference',
    description: 'Filter NEB reference books (true/false)',
    example: 'true',
    type: String,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of books retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllBooks(
    @GetUser('schoolId') schoolId: number,
    @Query('bookType') bookType?: string,
    @Query('subject') subject?: string,
    @Query('isSeeReference') isSeeReference?: string,
    @Query('isNebReference') isNebReference?: string,
  ) {
    const seeRef = isSeeReference ? isSeeReference === 'true' : undefined;
    const nebRef = isNebReference ? isNebReference === 'true' : undefined;
    return this.libraryService.findAllBooks(
      schoolId,
      bookType,
      subject,
      seeRef,
      nebRef,
    );
  }

  @Get('books/see-reference')
  @ApiOperation({
    summary: 'Get SEE reference books',
    description: 'Retrieve all books marked as SEE examination references.',
  })
  @ApiResponse({
    status: 200,
    description: 'SEE reference books retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSeeReferenceBooks(@GetUser('schoolId') schoolId: number) {
    return this.libraryService.getSeeReferenceBooks(schoolId);
  }

  @Get('books/neb-reference')
  @ApiOperation({
    summary: 'Get NEB reference books',
    description: 'Retrieve all books marked as NEB curriculum references.',
  })
  @ApiResponse({
    status: 200,
    description: 'NEB reference books retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getNebReferenceBooks(@GetUser('schoolId') schoolId: number) {
    return this.libraryService.getNebReferenceBooks(schoolId);
  }

  @Get('books/:id')
  @ApiOperation({
    summary: 'Get book by ID',
    description: 'Retrieve detailed information about a specific book.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Book details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOneBook(@Param('id') id: string, @GetUser('schoolId') schoolId: number) {
    return this.libraryService.findOneBook(+id, schoolId);
  }

  @Patch('books/:id')
  @ApiOperation({
    summary: 'Update book',
    description: 'Update book information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
    type: Number,
  })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  updateBook(
    @Param('id') id: string,
    @GetUser('schoolId') schoolId: number,
    @Body() updateDto: UpdateBookDto,
  ) {
    return this.libraryService.updateBook(+id, schoolId, updateDto);
  }

  @Delete('books/:id')
  @ApiOperation({
    summary: 'Delete book',
    description: 'Remove a book from the library system.',
  })
  @ApiParam({
    name: 'id',
    description: 'Book ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Book deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  removeBook(@Param('id') id: string, @GetUser('schoolId') schoolId: number) {
    return this.libraryService.removeBook(+id, schoolId);
  }

  // Book Issues
  @Post('issues')
  @ApiOperation({
    summary: 'Issue book to student',
    description: 'Issue a book to a student for borrowing.',
  })
  @ApiBody({ type: CreateBookIssueDto })
  @ApiResponse({
    status: 201,
    description: 'Book issued successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  issueBook(@Body() createDto: CreateBookIssueDto) {
    return this.libraryService.issueBook(createDto);
  }

  @Post('issues/return')
  @ApiOperation({
    summary: 'Return book',
    description: 'Record book return and calculate any fines for late returns.',
  })
  @ApiBody({ type: ReturnBookDto })
  @ApiResponse({
    status: 200,
    description: 'Book returned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Issue record not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  returnBook(
    @Body('issueId', ParseIntPipe) issueId: number,
    @GetUser('schoolId') schoolId: number,
    @Body() returnDto: ReturnBookDto,
  ) {
    return this.libraryService.returnBook(issueId, schoolId, returnDto);
  }

  @Get('issues/student/:studentId')
  @ApiOperation({
    summary: 'Get student issued books',
    description: 'Retrieve all books currently issued to a specific student.',
  })
  @ApiParam({
    name: 'studentId',
    description: 'Student ID',
    example: 123,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Student issued books retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStudentIssuedBooks(
    @Param('studentId', ParseIntPipe) studentId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.libraryService.getStudentIssuedBooks(studentId, schoolId);
  }

  @Get('issues/overdue')
  @ApiOperation({
    summary: 'Get overdue books',
    description: 'Retrieve all books that are past their return date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue books retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getOverdueBooks(@GetUser('schoolId') schoolId: number) {
    return this.libraryService.getOverdueBooks(schoolId);
  }

  @Get('issues/:issueId/receipt')
  @ApiOperation({
    summary: 'Generate fine receipt',
    description: 'Generate a fine receipt for a book return.',
  })
  @ApiParam({
    name: 'issueId',
    description: 'Issue ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Fine receipt generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Issue not found' })
  generateFineReceipt(
    @Param('issueId', ParseIntPipe) issueId: number,
    @GetUser('schoolId') schoolId: number,
  ) {
    return this.libraryService.generateFineReceipt(issueId, schoolId);
  }
}
