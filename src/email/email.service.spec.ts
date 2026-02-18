import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let service: EmailService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'testpass',
        SMTP_FROM: 'noreply@school.edu.np',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email when SMTP is configured', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      };
      const result = await service.sendEmail(options);
      expect(result).toBe(true);
    });
  });

  describe('getEmailTemplate', () => {
    it('should return admission confirmation template', () => {
      const data = {
        parentName: 'John Doe',
        studentName: 'Jane Doe',
        applicationNo: 'ADM20240001',
        schoolName: 'ABC School',
      };
      const template = service.getEmailTemplate('admissionConfirmation', data);
      expect(template).toContain('Admission Application Received');
      expect(template).toContain('John Doe');
    });

    it('should return admission approved template', () => {
      const data = {
        parentName: 'John Doe',
        studentName: 'Jane Doe',
        applicationNo: 'ADM20240001',
        className: 'Class 1',
      };
      const template = service.getEmailTemplate('admissionApproved', data);
      expect(template).toContain('Admission Approved');
    });

    it('should return password reset template', () => {
      const data = {
        resetUrl: 'https://example.com/reset',
      };
      const template = service.getEmailTemplate('passwordReset', data);
      expect(template).toContain('Password Reset Request');
      expect(template).toContain('https://example.com/reset');
    });

    it('should return fee payment reminder template', () => {
      const data = {
        parentName: 'John Doe',
        studentName: 'Jane Doe',
        amountDue: '5000',
        dueDate: '2081-01-15',
      };
      const template = service.getEmailTemplate('feePaymentReminder', data);
      expect(template).toContain('Fee Payment Reminder');
      expect(template).toContain('5000');
    });

    it('should return exam schedule template', () => {
      const data = {
        studentName: 'Jane Doe',
        examName: 'Mid Term',
      };
      const template = service.getEmailTemplate('examSchedule', data);
      expect(template).toContain('Exam Schedule Published');
    });

    it('should return marks published template', () => {
      const data = {
        parentName: 'John Doe',
        studentName: 'Jane Doe',
        examName: 'Mid Term',
        totalMarks: '450',
        percentage: '90',
      };
      const template = service.getEmailTemplate('marksPublished', data);
      expect(template).toContain('Marks Published');
      expect(template).toContain('90');
    });

    it('should return empty string for unknown template', () => {
      const template = service.getEmailTemplate('unknown', {});
      expect(template).toBe('');
    });
  });
});
