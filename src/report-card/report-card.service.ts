import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import { NepaliNumberUtil } from '../utils/nepali-number.util';

@Injectable()
export class ReportCardService {
  async generateBilingualReportCard(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // School Header (Bilingual)
        doc
          .fontSize(16)
          .text('Shree Nepal Higher Secondary School', { align: 'center' });
        doc
          .fontSize(12)
          .text('श्री नेपाल उच्च माध्यमिक विद्यालय', { align: 'center' });
        doc.moveDown();

        // Student Details
        doc.fontSize(14).text('Report Card / प्रतिवेदन कार्ड', {
          underline: true,
          align: 'center',
        });
        doc.moveDown();

        const details = [
          `Student Name / विद्यार्थीको नाम: ${data.studentName} / ${data.studentNameNp || data.studentName}`,
          `Class / कक्षा: ${data.className}`,
          `Academic Year / शैक्षिक साल: ${data.academicYear} (वि.सं. ${NepaliDateUtil.getCurrentFiscalYear().bsYear})`,
          `Roll Number / रोल नम्बर: ${data.rollNumber}`,
        ];

        details.forEach((line) => doc.fontSize(10).text(line));
        doc.moveDown();

        // Marks Table Header
        doc.fontSize(11).text('Subject / विषय', 50, doc.y, { width: 150 });
        doc.text('Theory / सैद्धान्तिक', 200, doc.y, {
          width: 80,
          align: 'right',
        });
        doc.text('Practical / व्यावहारिक', 280, doc.y, {
          width: 80,
          align: 'right',
        });
        doc.text('Total / कुल', 360, doc.y, { width: 60, align: 'right' });
        doc.text('Grade / ग्रेड', 420, doc.y, { width: 50, align: 'center' });
        doc.moveDown();

        // Marks Table Rows
        data.marks.forEach((mark: any) => {
          doc.fontSize(9).text(mark.subjectName, 50, doc.y, { width: 150 });
          doc.text(
            NepaliNumberUtil.toNepali(mark.theoryMarks?.toString() || '0'),
            200,
            doc.y,
            { width: 80, align: 'right' },
          );
          doc.text(
            NepaliNumberUtil.toNepali(mark.practicalMarks?.toString() || '0'),
            280,
            doc.y,
            { width: 80, align: 'right' },
          );
          doc.text(
            NepaliNumberUtil.toNepali(mark.totalMarks?.toString() || '0'),
            360,
            doc.y,
            { width: 60, align: 'right' },
          );
          doc.text(mark.grade, 420, doc.y, { width: 50, align: 'center' });
          doc.moveDown();
        });

        doc.moveDown();

        // Overall Result
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text(`Overall Percentage / कुल प्रतिशत: ${data.percentage}%`);
        doc.font('Helvetica').fontSize(11);
        doc.text(`Grade / ग्रेड: ${data.grade} (${data.gradePoint})`);
        doc.text(
          `Division / श्रेणी: ${this.getDivision(parseFloat(data.percentage))}`,
        );
        doc.moveDown();

        // Principal Signature
        doc.fontSize(10).text('_________________________', { align: 'right' });
        doc.text('Principal / प्रधानाध्यापक', { align: 'right' });
        doc.text(`Date / मिति: ${NepaliDateUtil.today().bsDate}`, {
          align: 'right',
        });

        doc.end();
      } catch {
        reject(new Error('PDF generation timed out'));
      }
    });
  }

  private getDivision(percentage: number): string {
    if (percentage >= 80) return 'Distinction / विभाग';
    if (percentage >= 60) return 'First Division / प्रथम श्रेणी';
    if (percentage >= 45) return 'Second Division / द्वितीय श्रेणी';
    return 'Third Division / तृतीय श्रेणी';
  }
}
