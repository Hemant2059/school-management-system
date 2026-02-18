import { registerDecorator, ValidationOptions } from 'class-validator';
import { MOEST_CASTE_CODE_REGEX } from '../../common/constants/nepal.constants';

/**
 * Validator for Nepal MOEST (Ministry of Education, Science and Technology) Caste Codes.
 * Example Valid Codes: 01A (Brahmin), 02B (Chhetri), 11A (Dalit).
 */
export function IsMoestCasteCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMoestCasteCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            value == null ||
            (typeof value === 'string' && MOEST_CASTE_CODE_REGEX.test(value))
          );
        },
        defaultMessage() {
          return 'Invalid MOEST caste code format (e.g., "01A" for Brahmin, "11A" for Dalit)';
        },
      },
    });
  };
}
