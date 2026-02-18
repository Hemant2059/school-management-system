import { registerDecorator, ValidationOptions } from 'class-validator';
import { NepaliDateUtil } from '../../utils/nepali-date.util';

const BS_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates that a string is a valid BS (Bikram Sambat) date in YYYY-MM-DD format.
 * Use for dateOfBirthBs, establishedDateBs, etc.
 */
export function IsValidBsDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidBsDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null || value === '') return true;
          if (typeof value !== 'string') return false;
          if (!BS_DATE_FORMAT.test(value.trim())) return false;
          return NepaliDateUtil.isValidBsDate(value.trim());
        },
        defaultMessage() {
          return 'Must be a valid BS date in YYYY-MM-DD format (e.g. 2067-02-01)';
        },
      },
    });
  };
}
