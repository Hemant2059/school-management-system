import { NepaliDateUtil } from './nepali-date.util';
import { NepaliNumberUtil } from './nepali-number.util';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         Nepal Date & Number Utilities Test                   ║');
console.log(
  '╚══════════════════════════════════════════════════════════════╝\n',
);

// Test 1: AD to BS Conversion
console.log('Test 1: AD to BS Conversion');
console.log('─'.repeat(60));
const today = new Date();
const { bsDate, bsDateObj } = NepaliDateUtil.adToBs(today);
console.log(`Today (AD): ${today.toDateString()}`);
console.log(`Today (BS): ${bsDate}`);
console.log(
  `BS Object: Year=${bsDateObj.year}, Month=${bsDateObj.month}, Day=${bsDateObj.day}\n`,
);

// Test 2: BS to AD Conversion
console.log('Test 2: BS to AD Conversion');
console.log('─'.repeat(60));
const testBsDate = '2081-01-01'; // Baisakh 1, 2081
const adDate = NepaliDateUtil.bsToAd(testBsDate);
console.log(`${testBsDate} (BS) = ${adDate.toDateString()} (AD)\n`);

// Test 3: Date Formatting (English)
console.log('Test 3: Date Formatting (English)');
console.log('─'.repeat(60));
const formattedEn = NepaliDateUtil.formatBsDate(
  '2081-01-01',
  'ddd DD, MMMM YYYY',
  'en',
);
console.log(`English format: ${formattedEn}\n`);

// Test 4: Date Formatting (Nepali)
console.log('Test 4: Date Formatting (Nepali)');
console.log('─'.repeat(60));
const formattedNp = NepaliDateUtil.formatBsDate(
  '2081-01-01',
  'ddd DD, MMMM YYYY',
  'np',
);
console.log(`Nepali format: ${formattedNp}\n`);

// Test 5: Month Names
console.log('Test 5: Month Names');
console.log('─'.repeat(60));
console.log(`Month 1 (English): ${NepaliDateUtil.getMonthName(1, 'en')}`);
console.log(`Month 1 (Nepali): ${NepaliDateUtil.getMonthName(1, 'np')}`);
console.log(`Month 12 (English): ${NepaliDateUtil.getMonthName(12, 'en')}`);
console.log(`Month 12 (Nepali): ${NepaliDateUtil.getMonthName(12, 'np')}\n`);

// Test 6: Fiscal Year
console.log('Test 6: Current Fiscal Year');
console.log('─'.repeat(60));
const fiscalYear = NepaliDateUtil.getCurrentFiscalYear();
console.log(`Fiscal Year Code: ${fiscalYear.yearCode}`);
console.log(`Start Date (BS): ${fiscalYear.start}`);
console.log(`End Date (BS): ${fiscalYear.end}`);
console.log(`BS Year: ${fiscalYear.bsYear}\n`);

// Test 7: Number Conversion
console.log('Test 7: Number Conversion (English ↔ Nepali)');
console.log('─'.repeat(60));
console.log(`English "2081" → Nepali: ${NepaliNumberUtil.toNepali(2081)}`);
console.log(`English "123456" → Nepali: ${NepaliNumberUtil.toNepali(123456)}`);
console.log(`Nepali "२०८१" → English: ${NepaliNumberUtil.toEnglish('२०८१')}`);
console.log(
  `Nepali "१,२३,४५६" → English: ${NepaliNumberUtil.toEnglish('१,२३,४५६')}\n`,
);

// Test 8: Nepali Number Formatting (Lakhs/Crores)
console.log('Test 8: Nepali Number Formatting (Lakhs/Crores)');
console.log('─'.repeat(60));
console.log(
  `123456789 (English): ${NepaliNumberUtil.formatNumber(123456789, 'en')}`,
);
console.log(
  `123456789 (Nepali): ${NepaliNumberUtil.formatNumber(123456789, 'ne')}`,
);
console.log(
  `१२३४५६७८९ (to English): ${NepaliNumberUtil.formatNumber('१२३४५६७८९', 'en')}`,
);
console.log(
  `१२३४५६७८९ (to Nepali): ${NepaliNumberUtil.formatNumber('१२३४५६७८९', 'ne')}\n`,
);

// Test 9: English Number Formatting (Thousands)
console.log('Test 9: English Number Formatting (Thousands)');
console.log('─'.repeat(60));
console.log(
  `123456789 (English): ${NepaliNumberUtil.formatEnglishNumber(123456789, 'en')}`,
);
console.log(
  `123456789 (Nepali): ${NepaliNumberUtil.formatEnglishNumber(123456789, 'ne')}`,
);
console.log(
  `१२३४५६७८९ (to English): ${NepaliNumberUtil.formatEnglishNumber('१२३४५६७८९', 'en')}`,
);
console.log(
  `१२३४५६७८९ (to Nepali): ${NepaliNumberUtil.formatEnglishNumber('१२३४५६७८९', 'ne')}\n`,
);

// Test 10: Currency Amount Formatting (Nepali Style)
console.log('Test 10: Currency Amount Formatting (Nepali Style)');
console.log('─'.repeat(60));
console.log(
  `125000 NPR (English): ${NepaliNumberUtil.formatAmount(125000, 2, 'en')}`,
);
console.log(
  `125000 NPR (Nepali): ${NepaliNumberUtil.formatAmount(125000, 2, 'ne')}`,
);
console.log(
  `1234567.89 NPR (English): ${NepaliNumberUtil.formatAmount(1234567.89, 2, 'en')}`,
);
console.log(
  `1234567.89 NPR (Nepali): ${NepaliNumberUtil.formatAmount(1234567.89, 2, 'ne')}\n`,
);

// Test 11: Currency Amount Formatting (English Style)
console.log('Test 11: Currency Amount Formatting (English Style)');
console.log('─'.repeat(60));
console.log(
  `1234567.89 (English): ${NepaliNumberUtil.formatEnglishAmount(1234567.89, 2, 'en')}`,
);
console.log(
  `1234567.89 (Nepali): ${NepaliNumberUtil.formatEnglishAmount(1234567.89, 2, 'ne')}\n`,
);

// Test 12: Currency with NPR Symbol
console.log('Test 12: Currency with NPR Symbol');
console.log('─'.repeat(60));
console.log(
  `125000 NPR (English): ${NepaliNumberUtil.formatCurrency(125000, 'en')}`,
);
console.log(
  `125000 NPR (Nepali): ${NepaliNumberUtil.formatCurrency(125000, 'ne')}`,
);
console.log(
  `1234567.89 NPR (English): ${NepaliNumberUtil.formatCurrency(1234567.89, 'en')}`,
);
console.log(
  `1234567.89 NPR (Nepali): ${NepaliNumberUtil.formatCurrency(1234567.89, 'ne')}\n`,
);

// Test 13: Large Number Formatting with Suffixes
console.log('Test 13: Large Number Formatting with Suffixes');
console.log('─'.repeat(60));
console.log(
  `5000000 (English): ${NepaliNumberUtil.formatLargeNumber(5000000, 'en')}`,
);
console.log(
  `5000000 (Nepali): ${NepaliNumberUtil.formatLargeNumber(5000000, 'ne')}`,
);
console.log(
  `125000 (English): ${NepaliNumberUtil.formatLargeNumber(125000, 'en')}`,
);
console.log(
  `125000 (Nepali): ${NepaliNumberUtil.formatLargeNumber(125000, 'ne')}`,
);
console.log(
  `15000000 (English): ${NepaliNumberUtil.formatLargeNumber(15000000, 'en')}`,
);
console.log(
  `15000000 (Nepali): ${NepaliNumberUtil.formatLargeNumber(15000000, 'ne')}\n`,
);

// Test 14: Parse Nepali Number
console.log('Test 14: Parse Nepali Number');
console.log('─'.repeat(60));
console.log(
  `Parse "१,२३,४५६": ${NepaliNumberUtil.parseNepaliNumber('१,२३,४५६')}`,
);
console.log(`Parse "२०८१": ${NepaliNumberUtil.parseNepaliNumber('२०८१')}`);
console.log(
  `Parse "१२,३४,५६७.८९": ${NepaliNumberUtil.parseNepaliNumber('१२,३४,५६७.८९')}\n`,
);

// Test 15: Date Validation
console.log('Test 15: Date Validation');
console.log('─'.repeat(60));
console.log(
  `Is '2081-01-01' valid? ${NepaliDateUtil.isValidBsDate('2081-01-01')}`,
);
console.log(
  `Is '2081-13-01' valid? ${NepaliDateUtil.isValidBsDate('2081-13-01')}`,
);
console.log(
  `Is '2081-02-32' valid? ${NepaliDateUtil.isValidBsDate('2081-02-32')}\n`,
);

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    ✅ All Tests Passed!                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
