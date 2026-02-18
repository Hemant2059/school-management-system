import { NepaliDateUtil } from './nepali-date.util';
import { NepaliNumberUtil } from './nepali-number.util';

describe('NepaliDateUtil', () => {
  describe('adToBs', () => {
    it('should convert AD date to BS', () => {
      const today = new Date();
      const { bsDate, bsDateObj } = NepaliDateUtil.adToBs(today);
      expect(bsDate).toBeDefined();
      expect(bsDateObj.year).toBeGreaterThan(2070);
      expect(bsDateObj.month).toBeGreaterThanOrEqual(1);
      expect(bsDateObj.month).toBeLessThanOrEqual(12);
      expect(bsDateObj.day).toBeGreaterThanOrEqual(1);
      expect(bsDateObj.day).toBeLessThanOrEqual(32);
    });
  });

  describe('bsToAd', () => {
    it('should convert BS date to AD', () => {
      const adDate = NepaliDateUtil.bsToAd('2081-01-01');
      expect(adDate).toBeInstanceOf(Date);
    });
  });

  describe('formatBsDate', () => {
    it('should format BS date in English', () => {
      const formatted = NepaliDateUtil.formatBsDate(
        '2081-01-01',
        'DD MMMM YYYY',
        'en',
      );
      expect(formatted).toBeDefined();
    });

    it('should format BS date in Nepali', () => {
      const formatted = NepaliDateUtil.formatBsDate(
        '2081-01-01',
        'DD MMMM YYYY',
        'np',
      );
      expect(formatted).toBeDefined();
    });
  });

  describe('getMonthName', () => {
    it('should get month name in English', () => {
      expect(NepaliDateUtil.getMonthName(1, 'en')).toBe('Baisakh');
      expect(NepaliDateUtil.getMonthName(12, 'en')).toBe('Chaitra');
    });

    it('should get month name in Nepali', () => {
      expect(NepaliDateUtil.getMonthName(1, 'np')).toBe('बैशाख');
      expect(NepaliDateUtil.getMonthName(12, 'np')).toBe('चैत्र');
    });
  });

  describe('getCurrentFiscalYear', () => {
    it('should return current fiscal year', () => {
      const fiscalYear = NepaliDateUtil.getCurrentFiscalYear();
      expect(fiscalYear.yearCode).toBeDefined();
      expect(fiscalYear.bsYear).toBeGreaterThan(2070);
      expect(fiscalYear.start).toBeDefined();
      expect(fiscalYear.end).toBeDefined();
    });
  });

  describe('isValidBsDate', () => {
    it('should validate correct BS dates', () => {
      expect(NepaliDateUtil.isValidBsDate('2081-01-01')).toBe(true);
      expect(NepaliDateUtil.isValidBsDate('2081-12-30')).toBe(true);
    });

    it('should invalidate incorrect BS dates', () => {
      expect(NepaliDateUtil.isValidBsDate('2081-13-01')).toBe(false);
      expect(NepaliDateUtil.isValidBsDate('invalid')).toBe(false);
    });
  });
});

describe('NepaliNumberUtil', () => {
  describe('toNepali', () => {
    it('should convert English numbers to Nepali', () => {
      expect(NepaliNumberUtil.toNepali(2081)).toBe('२०८१');
      expect(NepaliNumberUtil.toNepali(123456)).toBeDefined();
    });
  });

  describe('toEnglish', () => {
    it('should convert Nepali numbers to English', () => {
      expect(NepaliNumberUtil.toEnglish('२०८१')).toBe('2081');
      expect(NepaliNumberUtil.toEnglish('१,२३,४५')).toBeDefined();
    });
  });

  describe('formatNumber', () => {
    it('should format numbers', () => {
      const formattedNe = NepaliNumberUtil.formatNumber(123456789, 'ne');
      const formattedEn = NepaliNumberUtil.formatNumber(123456789, 'en');
      expect(formattedNe).toBeDefined();
      expect(formattedEn).toBeDefined();
    });
  });

  describe('formatAmount', () => {
    it('should format currency amounts', () => {
      const formattedEn = NepaliNumberUtil.formatAmount(125000, 2, 'en');
      const formattedNe = NepaliNumberUtil.formatAmount(125000, 2, 'ne');
      expect(formattedEn).toBeDefined();
      expect(formattedNe).toBeDefined();
    });
  });

  describe('formatCurrency', () => {
    it('should format currency', () => {
      const formattedEn = NepaliNumberUtil.formatCurrency(125000, 'en');
      const formattedNe = NepaliNumberUtil.formatCurrency(125000, 'ne');
      expect(formattedEn).toBeDefined();
      expect(formattedNe).toBeDefined();
    });
  });

  describe('parseNepaliNumber', () => {
    it('should parse Nepali number strings', () => {
      expect(NepaliNumberUtil.parseNepaliNumber('१,२३,४५')).toBeDefined();
      expect(NepaliNumberUtil.parseNepaliNumber('२०८१')).toBeDefined();
    });
  });
});
