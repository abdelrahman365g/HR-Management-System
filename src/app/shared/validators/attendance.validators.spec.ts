import { FormControl, FormGroup } from '@angular/forms';
import {
  actualTimeRangeValidator,
  atLeastOneTimeValidator,
  dateRangeValidator,
  notBeforeDateValidator,
  notFutureDateValidator,
} from './attendance.validators';

function searchGroup(dateFrom: string, dateTo: string): FormGroup {
  return new FormGroup({
    dateFrom: new FormControl(dateFrom),
    dateTo: new FormControl(dateTo),
  });
}

function recordGroup(checkIn: string, checkOut: string): FormGroup {
  return new FormGroup({
    check_in_actual: new FormControl(checkIn),
    check_out_actual: new FormControl(checkOut),
  });
}

describe('dateRangeValidator', () => {
  const validate = dateRangeValidator();

  it('accepts from before to', () => {
    expect(validate(searchGroup('2026-01-01', '2026-01-31'))).toBeNull();
  });

  it('accepts equal dates', () => {
    expect(validate(searchGroup('2026-01-15', '2026-01-15'))).toBeNull();
  });

  it('rejects from after to', () => {
    expect(validate(searchGroup('2026-01-31', '2026-01-01'))).toEqual({ dateRange: true });
  });

  it('waits for both dates', () => {
    expect(validate(searchGroup('2026-01-31', ''))).toBeNull();
    expect(validate(searchGroup('', '2026-01-01'))).toBeNull();
  });

  it('ignores non-ISO fragments', () => {
    expect(validate(searchGroup('01/31/2026', '2026-01-01'))).toBeNull();
  });
});

describe('actualTimeRangeValidator', () => {
  const validate = actualTimeRangeValidator();

  it('accepts check-out after check-in', () => {
    expect(validate(recordGroup('09:00', '17:00'))).toBeNull();
  });

  it('rejects equal times', () => {
    expect(validate(recordGroup('09:00', '09:00'))).toEqual({ timeRange: true });
  });

  it('rejects check-out before check-in', () => {
    expect(validate(recordGroup('17:00', '09:00'))).toEqual({ timeRange: true });
  });

  it('waits for both times', () => {
    expect(validate(recordGroup('09:00', ''))).toBeNull();
    expect(validate(recordGroup('', '17:00'))).toBeNull();
  });
});

describe('atLeastOneTimeValidator', () => {
  const validate = atLeastOneTimeValidator();

  it('accepts when either time is present', () => {
    expect(validate(recordGroup('09:00', ''))).toBeNull();
    expect(validate(recordGroup('', '17:00'))).toBeNull();
  });

  it('rejects when both times are empty', () => {
    expect(validate(recordGroup('', ''))).toEqual({ atLeastOneTime: true });
  });
});

describe('notBeforeDateValidator', () => {
  const validate = notBeforeDateValidator(() => '2010-06-15');

  it('accepts the contract date itself', () => {
    expect(validate(new FormControl('2010-06-15'))).toBeNull();
  });

  it('accepts a later date', () => {
    expect(validate(new FormControl('2010-06-16'))).toBeNull();
  });

  it('rejects an earlier date', () => {
    expect(validate(new FormControl('2010-06-14'))).toEqual({ beforeContractDate: true });
  });

  it('ignores empty values and empty config', () => {
    expect(validate(new FormControl(''))).toBeNull();
    expect(notBeforeDateValidator(() => '')(new FormControl('2001-01-01'))).toBeNull();
  });
});

describe('notFutureDateValidator', () => {
  const validate = notFutureDateValidator();

  it('accepts today', () => {
    const today = new Date().toLocaleDateString('en-CA');
    expect(validate(new FormControl(today))).toBeNull();
  });

  it('accepts past dates', () => {
    expect(validate(new FormControl('2001-01-01'))).toBeNull();
  });

  it('rejects tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toLocaleDateString('en-CA');
    expect(validate(new FormControl(iso))).toEqual({ futureDate: true });
  });

  it('ignores empty values', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});
