import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Numbers must be plain decimals — scientific notation ("1e3") and
// symbols/letters are rejected so the DB never sees a value the
// settings page didn't intend. Empty values are left to
// Validators.required.

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

function matches(value: string): boolean {
  return DECIMAL_PATTERN.test(value);
}

export function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    return matches(value) && Number(value) > 0 ? null : { positiveNumber: true };
  };
}

export function nonNegativeNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    return matches(value) && Number(value) >= 0 ? null : { nonNegativeNumber: true };
  };
}
