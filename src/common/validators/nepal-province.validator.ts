import { registerDecorator, ValidationOptions } from 'class-validator';
import { NEPAL_PROVINCE_IDS } from '../constants/nepal.constants';

/**
 * Validates that a value is a valid Nepal province ID (1–7).
 * Use on provinceId fields for school, student, guardian addresses.
 */
export function IsNepalProvinceId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNepalProvinceId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null) return true;
          return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            (NEPAL_PROVINCE_IDS as readonly number[]).includes(value)
          );
        },
        defaultMessage() {
          return 'provinceId must be a valid Nepal province (1–7)';
        },
      },
    });
  };
}

/**
 * For use with @IsOptional() – validates Min(1) and Max(7) when value is present.
 * Use in DTOs: @IsOptional() @IsInt() @Min(1) @Max(7) provinceId?: number;
 * Or use the custom decorator above for a single constraint.
 */
export const NEPAL_PROVINCE_MIN = 1;
export const NEPAL_PROVINCE_MAX = 7;
