import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  MIN_EMPLOYEE_AGE,
  NATIONAL_ID_LENGTH,
  PHONE_MIN_LENGTH,
} from '../../core/constants/validation.constant';

// Empty values are left to Validators.required — these only fire when
// there is something to actually check. Error keys map 1:1 to
// VALIDATION_MESSAGES entries in the template.

const PHONE_PATTERN = new RegExp(/^01[0125][0-9]{8}$/gm);
const NATIONAL_ID_PATTERN = new RegExp(`^[0-9]{${NATIONAL_ID_LENGTH}}$`);
const SALARY_PATTERN = /^\d+(\.\d{1,2})?$/;

// Parses 'YYYY-MM-DD' as a local date so the day never shifts across
// timezones, and rejects impossible dates like 2026-02-31.
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function fullAge(dob: Date, today: Date): number {
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    return PHONE_PATTERN.test(value) ? null : { phone: true };
  };
}

export function ageValidator(minAge: number = MIN_EMPLOYEE_AGE): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    const dob = parseIsoDate(value);
    if (!dob) return { age: true };
    return fullAge(dob, new Date()) >= minAge ? null : { age: true };
  };
}

export function nationalIdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    return NATIONAL_ID_PATTERN.test(value) ? null : { nationalId: true };
  };
}

export function contractDateValidator(minDate: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    const min = minDate();
    if (!min || !parseIsoDate(value)) return null;
    return value >= min ? null : { contractDate: true };
  };
}

export function salaryValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    if (!SALARY_PATTERN.test(value)) return { salary: true };
    return Number(value) > 0 ? null : { salary: true };
  };
}

// Group-level: check-out must be after check-in. Times are zero-padded
// 'HH:mm' strings, so a plain string comparison is enough.
export function timeRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const checkIn = String(group.get('check_in_time')?.value ?? '');
    const checkOut = String(group.get('check_out_time')?.value ?? '');
    if (!checkIn || !checkOut) return null;
    return checkOut > checkIn ? null : { timeRange: true };
  };
}

// Required that also rejects whitespace-only text; returns the
// standard 'required' key so templates show the generic message.
export function nonEmptyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return String(control.value ?? '').trim() !== '' ? null : { required: true };
  };
}
