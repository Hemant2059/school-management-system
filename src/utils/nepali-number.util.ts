// Correct named imports from nepali-number package
import {
  englishToNepaliNumber,
  nepaliToEnglishNumber,
  nepaliNumberFormat,
  englishNumberFormat,
  nepaliAmountFormat,
  englishAmountFormat,
} from 'nepali-number';

export class NepaliNumberUtil {
  /**
   * Convert English number to Nepali Unicode
   * @param num - Number or string to convert
   * @returns Nepali Unicode string
   */
  static toNepali(num: number | string): string {
    return englishToNepaliNumber(num.toString());
  }

  /**
   * Convert Nepali Unicode number back to English
   * @param nepaliNum - Nepali Unicode number string
   * @returns English number string
   */
  static toEnglish(nepaliNum: string): string {
    return nepaliToEnglishNumber(nepaliNum);
  }

  /**
   * Format number in Nepali numbering system (lakhs/crores)
   * @param num - Number to format
   * @param locale - 'en' for English digits, 'ne' for Nepali digits
   * @returns Formatted number string
   */
  static formatNumber(
    num: number | string,
    locale: 'en' | 'ne' = 'en',
  ): string {
    return nepaliNumberFormat(num.toString(), locale);
  }

  /**
   * Format number in English numbering system (thousands)
   * @param num - Number to format
   * @param locale - 'en' for English digits, 'ne' for Nepali digits
   * @returns Formatted number string
   */
  static formatEnglishNumber(
    num: number | string,
    locale: 'en' | 'ne' = 'en',
  ): string {
    return englishNumberFormat(num.toString(), locale);
  }

  /**
   * Format currency amount in Nepali style (lakhs/crores)
   * @param amount - Amount to format
   * @param precision - Decimal precision (default: 2)
   * @param locale - 'en' for English digits, 'ne' for Nepali digits
   * @returns Formatted amount string
   */
  static formatAmount(
    amount: number | string,
    precision: number = 2,
    locale: 'en' | 'ne' = 'en',
  ): string {
    return nepaliAmountFormat(amount.toString(), precision, locale);
  }

  /**
   * Format currency amount in English style (thousands)
   * @param amount - Amount to format
   * @param precision - Decimal precision (default: 2)
   * @param locale - 'en' for English digits, 'ne' for Nepali digits
   * @returns Formatted amount string
   */
  static formatEnglishAmount(
    amount: number | string,
    precision: number = 2,
    locale: 'en' | 'ne' = 'en',
  ): string {
    return englishAmountFormat(amount.toString(), precision, locale);
  }

  /**
   * Format currency with NPR symbol
   * @param amount - Amount in NPR
   * @param locale - 'en' for English digits, 'ne' for Nepali digits
   * @returns Formatted currency string with NPR symbol
   */
  static formatCurrency(amount: number, locale: 'en' | 'ne' = 'en'): string {
    const formatted = this.formatAmount(amount, 2, locale);
    return locale === 'ne' ? `रु ${formatted}` : `Rs. ${formatted}`;
  }

  /**
   * Format large numbers with lakhs/crores notation
   * @param num - Number to format
   * @param locale - 'en' for English digits, 'ne' for Nepali digits
   * @returns Formatted string (e.g., "50.00 L", "1.23 Cr")
   */
  static formatLargeNumber(num: number, locale: 'en' | 'ne' = 'en'): string {
    if (num >= 10000000) {
      // Crores
      const crores = num / 10000000;
      const formatted = crores.toFixed(2);
      const suffix = locale === 'ne' ? ' करोड' : ' Cr';
      return `${this.formatNumber(formatted, locale)}${suffix}`;
    } else if (num >= 100000) {
      // Lakhs
      const lakhs = num / 100000;
      const formatted = lakhs.toFixed(2);
      const suffix = locale === 'ne' ? ' लाख' : ' L';
      return `${this.formatNumber(formatted, locale)}${suffix}`;
    } else if (num >= 1000) {
      // Thousands
      const thousands = num / 1000;
      const formatted = thousands.toFixed(2);
      const suffix = locale === 'ne' ? ' हजार' : ' K';
      return `${this.formatNumber(formatted, locale)}${suffix}`;
    }
    return this.formatNumber(num, locale);
  }

  /**
   * Parse Nepali number string to JavaScript number
   * @param nepaliNumStr - Nepali number string (with or without formatting)
   * @returns JavaScript number
   */
  static parseNepaliNumber(nepaliNumStr: string): number {
    const englishStr = this.toEnglish(nepaliNumStr);
    // Remove commas and parse
    const cleanStr = englishStr.replace(/,/g, '');
    return parseFloat(cleanStr);
  }
}
