import { registerDecorator, ValidationOptions } from 'class-validator';
import { NEB_SEE_REGISTRATION_REGEX } from '../constants/nepal.constants';

/**
 * Validates SEE/NEB board exam registration number format.
 * Accepts alphanumeric and hyphen, 5–20 characters (optional field).
 */
export function IsNebSeeRegistration(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNebSeeRegistration',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null || value === '') return true;
          return (
            typeof value === 'string' &&
            NEB_SEE_REGISTRATION_REGEX.test(value.trim())
          );
        },
        defaultMessage() {
          return 'Board exam registration must be 5–20 alphanumeric characters (SEE/NEB format)';
        },
      },
    });
  };
}
