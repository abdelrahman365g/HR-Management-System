import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function dateRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const from = String(group.get('dateFrom')?.value ?? '');
    const to = String(group.get('dateTo')?.value ?? '');
    if (!from || !to) return null;
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) return null;
    return from <= to ? null : { dateRange: true };
  };
}

export function actualTimeRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const checkIn = String(group.get('check_in_actual')?.value ?? '');
    const checkOut = String(group.get('check_out_actual')?.value ?? '');
    if (!checkIn || !checkOut) return null;
    return checkOut > checkIn ? null : { timeRange: true };
  };
}

export function atLeastOneTimeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const checkIn = String(group.get('check_in_actual')?.value ?? '');
    const checkOut = String(group.get('check_out_actual')?.value ?? '');
    return checkIn || checkOut ? null : { atLeastOneTime: true };
  };
}


export function notBeforeDateValidator(minDate: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    const min = minDate();
    if (!value || !min) return null;
    if (!ISO_DATE.test(value)) return null;
    return value >= min ? null : { beforeContractDate: true };
  };
}

export function notFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    if (!ISO_DATE.test(value)) return null;
    const todayIso = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    return value <= todayIso ? null : { futureDate: true };
  };
}
