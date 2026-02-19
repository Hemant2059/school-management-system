import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private smtpHost: string;
  private smtpPort: number;
  private smtpUser: string;
  private smtpPass: string;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.smtpHost = this.configService.get('SMTP_HOST') || 'smtp.gmail.com';
    this.smtpPort = this.configService.get('SMTP_PORT') || 587;
    this.smtpUser = this.configService.get('SMTP_USER') || '';
    this.smtpPass = this.configService.get('SMTP_PASS') || '';
    this.fromEmail =
      this.configService.get('SMTP_FROM') || 'noreply@school.edu.np';
  }

  sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.smtpUser || !this.smtpPass) {
      console.log('Email not configured, skipping...');
      console.log(`Would send email to: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      return Promise.resolve(true);
    }

    try {
      console.log(`Sending email to: ${options.to}`);
      return Promise.resolve(true);
    } catch (error) {
      console.error('Failed to send email:', error);
      return Promise.resolve(false);
    }
  }

  getEmailTemplate(name: string, data: any): string {
    const templates: Record<string, (data: any) => string> = {
      admissionConfirmation: (d) => this.admissionConfirmationTemplate(d),
      admissionApproved: (d) => this.admissionApprovedTemplate(d),
      passwordReset: (d) => this.passwordResetTemplate(d),
      feePaymentReminder: (d) => this.feePaymentReminderTemplate(d),
      examSchedule: (d) => this.examScheduleTemplate(d),
      marksPublished: (d) => this.marksPublishedTemplate(d),
    };

    return templates[name]?.(data) || '';
  }

  private admissionConfirmationTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Admission Application Received</h2>
        <p>Dear ${data.parentName},</p>
        <p>We have received your online admission application for ${data.studentName}.</p>
        <p><strong>Application Number:</strong> ${data.applicationNo}</p>
        <p>We will review your application and get back to you within 2-3 working days.</p>
        <p>Thank you for choosing ${data.schoolName}.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }

  private admissionApprovedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Admission Approved!</h2>
        <p>Dear ${data.parentName},</p>
        <p>Congratulations! Your application for ${data.studentName} has been approved.</p>
        <p><strong>Application Number:</strong> ${data.applicationNo}</p>
        <p><strong>Class:</strong> ${data.className}</p>
        <p>Please visit the school office within 7 days to complete the enrollment process.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }

  private passwordResetTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Dear User,</p>
        <p>We received a request to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${data.resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }

  private feePaymentReminderTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Fee Payment Reminder</h2>
        <p>Dear ${data.parentName},</p>
        <p>This is a reminder that the fee payment for ${data.studentName} is due.</p>
        <p><strong>Amount Due:</strong> NPR ${data.amountDue}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
        <p>Please make the payment at your earliest convenience to avoid late charges.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }

  private examScheduleTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Exam Schedule Published</h2>
        <p>Dear ${data.studentName},</p>
        <p>The exam schedule for ${data.examName} has been published.</p>
        <p>Please log in to your student portal to view the complete schedule.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }

  private marksPublishedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Marks Published</h2>
        <p>Dear ${data.parentName},</p>
        <p>The marks for ${data.examName} have been published.</p>
        <p><strong>Student:</strong> ${data.studentName}</p>
        <p><strong>Total Marks:</strong> ${data.totalMarks}</p>
        <p><strong>Percentage:</strong> ${data.percentage}%</p>
        <p>Please log in to view the complete marksheet.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
  }
}
