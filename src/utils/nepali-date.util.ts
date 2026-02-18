import NepaliDate from 'nepali-date-converter';

export class NepaliDateUtil {
  /**
   * Convert AD Date to BS (Nepali) Date
   * @param date - JavaScript Date object or date string
   * @returns Object with bsDate string and bsDateObj
   */
  static adToBs(date: Date | string): { bsDate: string; bsDateObj: any } {
    try {
      const adDate = typeof date === 'string' ? new Date(date) : date;

      // Convert AD to Nepali Date using fromAD
      const nepaliDate = NepaliDate.fromAD(adDate);

      // Get BS date object
      const bsObj = nepaliDate.getBS();

      // Format: YYYY-MM-DD (for database storage)
      const bsDate = `${bsObj.year}-${String(bsObj.month + 1).padStart(2, '0')}-${String(bsObj.date).padStart(2, '0')}`;

      return {
        bsDate,
        bsDateObj: {
          year: bsObj.year,
          month: bsObj.month + 1, // Convert 0-indexed to 1-indexed
          day: bsObj.date,
          dayOfWeek: bsObj.day,
        },
      };
    } catch {
      console.error('BS date conversion failed');
      // Fallback to today's Nepali date
      return this.adToBs(new Date());
    }
  }

  /**
   * Convert BS (Nepali) Date to AD Date
   * @param bsDateStr - Nepali date string in format "YYYY-MM-DD"
   * @returns JavaScript Date object
   */
  static bsToAd(bsDateStr: string): Date {
    try {
      const [year, month, day] = bsDateStr.split('-').map(Number);

      // Create NepaliDate instance (month is 0-indexed)
      const nepaliDate = new NepaliDate(year, month - 1, day);

      // Convert to JavaScript Date
      return nepaliDate.toJsDate();
    } catch (error) {
      console.error('AD date conversion failed:', error);
      return new Date(); // Safe fallback
    }
  }

  /**
   * Get current Nepali date
   */
  static today(): { bsDate: string; bsDateObj: any } {
    return this.adToBs(new Date());
  }

  /**
   * Format Nepali date for display
   * @param bsDateStr - Nepali date string "YYYY-MM-DD"
   * @param format - Format string (see package docs)
   * @param language - 'en' or 'np' (Nepali)
   * @returns Formatted date string
   */
  static formatBsDate(
    bsDateStr: string,
    format: string = 'ddd DD, MMMM YYYY',
    language: 'en' | 'np' = 'en',
  ): string {
    try {
      const [year, month, day] = bsDateStr.split('-').map(Number);
      const nepaliDate = new NepaliDate(year, month - 1, day);
      return nepaliDate.format(format, language);
    } catch (error) {
      console.error('Date formatting failed:', error);
      return bsDateStr;
    }
  }

  /**
   * Format AD date to Nepali with custom format
   * @param date - JavaScript Date or string
   * @param format - Format string
   * @param language - 'en' or 'np'
   * @returns Formatted Nepali date string
   */
  static formatAdDate(
    date: Date | string,
    format: string = 'ddd DD, MMMM YYYY',
    language: 'en' | 'np' = 'en',
  ): string {
    try {
      const adDate = typeof date === 'string' ? new Date(date) : date;
      const nepaliDate = NepaliDate.fromAD(adDate);
      return nepaliDate.format(format, language);
    } catch (error) {
      console.error('Date formatting failed:', error);
      return date.toString();
    }
  }

  /**
   * Get Nepali month name
   * @param monthIndex - 1-12 (1=Baisakh, 12=Chaitra)
   * @param language - 'en' or 'np'
   * @returns Month name
   */
  static getMonthName(
    monthIndex: number,
    language: 'en' | 'np' = 'en',
  ): string {
    const nepaliMonthsEn = [
      'Baisakh',
      'Jestha',
      'Asar',
      'Shrawan',
      'Bhadra',
      'Aswin',
      'Kartik',
      'Mangsir',
      'Poush',
      'Magh',
      'Falgun',
      'Chaitra',
    ];

    const nepaliMonthsNp = [
      'बैशाख',
      'जेठ',
      'असार',
      'साउन',
      'भदौ',
      'असोज',
      'कार्तिक',
      'मंसिर',
      'पौष',
      'माघ',
      'फागुन',
      'चैत्र',
    ];

    const index = Math.max(0, Math.min(11, monthIndex - 1));
    return language === 'np' ? nepaliMonthsNp[index] : nepaliMonthsEn[index];
  }

  /**
   * Get current Nepali fiscal year
   * Fiscal year: Baisakh 1 to Chaitra end
   */
  static getCurrentFiscalYear(): {
    start: string;
    end: string;
    yearCode: string;
    bsYear: number;
  } {
    const todayBs = this.adToBs(new Date());
    const bsYear = todayBs.bsDateObj.year;

    // Fiscal year starts Baisakh 1 (month 1, day 1)
    const fiscalStart = `${bsYear}-01-01`;

    // Fiscal year ends Chaitra 32 (handles leap years)
    const fiscalEnd = `${bsYear}-12-32`;

    return {
      start: fiscalStart,
      end: fiscalEnd,
      yearCode: `${bsYear}-${bsYear + 1}`,
      bsYear,
    };
  }

  /**
   * Check if a Nepali date is valid
   */
  static isValidBsDate(bsDateStr: string): boolean {
    try {
      const [year, month, day] = bsDateStr.split('-').map(Number);
      const nepaliDate = new NepaliDate(year, month - 1, day);
      const bsObj = nepaliDate.getBS();
      return (
        bsObj.year === year && bsObj.month === month - 1 && bsObj.date === day
      );
    } catch {
      return false;
    }
  }
}
