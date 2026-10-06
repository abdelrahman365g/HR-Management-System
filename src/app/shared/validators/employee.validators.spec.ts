import { FormControl, FormGroup } from '@angular/forms';
import {
  ageValidator,
  contractDateValidator,
  nationalIdValidator,
  nonEmptyValidator,
  phoneValidator,
  salaryValidator,
  timeRangeValidator,
} from './employee.validators';

// Local-date ISO string so tests never depend on UTC shifts.
function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function today(): Date {
  return new Date();
}

function yearsAgo(years: number, extraDays = 0): string {
  const date = today();
  date.setFullYear(date.getFullYear() - years);
  date.setDate(date.getDate() - extraDays);
  return iso(date);
}

describe('phoneValidator', () => {
  const validate = phoneValidator();

  it('accepts exactly 11 digits', () => {
    expect(validate(new FormControl('01012345678'))).toBeNull();
  });

  it('accepts more than 11 digits', () => {
    expect(validate(new FormControl('010123456789'))).toBeNull();
  });

  it('rejects 10 digits', () => {
    expect(validate(new FormControl('0101234567'))).toEqual({ phone: true });
  });

  it('rejects letters mixed with digits', () => {
    expect(validate(new FormControl('12a45678901'))).toEqual({ phone: true });
  });

  it('rejects symbols', () => {
    expect(validate(new FormControl('0101234-5678'))).toEqual({ phone: true });
  });

  it('ignores empty values (required handles those)', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});

describe('ageValidator', () => {
  const validate = ageValidator();

  it('accepts someone exactly 20 years old today', () => {
    expect(validate(new FormControl(yearsAgo(20)))).toBeNull();
  });

  it('rejects 19 years and 364 days (20 years minus one day)', () => {
    expect(validate(new FormControl(yearsAgo(20, -1)))).toEqual({ age: true });
  });

  it('accepts someone older than 20', () => {
    expect(validate(new FormControl(yearsAgo(21)))).toBeNull();
  });

  it('rejects someone 19 years old', () => {
    expect(validate(new FormControl(yearsAgo(19)))).toEqual({ age: true });
  });

  it('rejects a non-date value', () => {
    expect(validate(new FormControl('not-a-date'))).toEqual({ age: true });
  });

  it('rejects an impossible date', () => {
    expect(validate(new FormControl('2006-02-31'))).toEqual({ age: true });
  });

  it('ignores empty values', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});

describe('nationalIdValidator', () => {
  const validate = nationalIdValidator();

  it('accepts exactly 14 digits', () => {
    expect(validate(new FormControl('12345678901234'))).toBeNull();
  });

  it('accepts leading zeros', () => {
    expect(validate(new FormControl('00000000000042'))).toBeNull();
  });

  it('rejects 13 digits', () => {
    expect(validate(new FormControl('1234567890123'))).toEqual({ nationalId: true });
  });

  it('rejects 15 digits', () => {
    expect(validate(new FormControl('123456789012345'))).toEqual({ nationalId: true });
  });

  it('rejects letters', () => {
    expect(validate(new FormControl('12a45678901234'))).toEqual({ nationalId: true });
  });

  it('ignores empty values', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});

describe('contractDateValidator', () => {
  const validate = contractDateValidator(() => '2008-01-01');

  it('accepts the founding date itself', () => {
    expect(validate(new FormControl('2008-01-01'))).toBeNull();
  });

  it('accepts a date after the founding date', () => {
    expect(validate(new FormControl('2020-05-10'))).toBeNull();
  });

  it('rejects a date before the founding date', () => {
    expect(validate(new FormControl('2007-12-31'))).toEqual({ contractDate: true });
  });

  it('ignores empty values and empty config', () => {
    expect(validate(new FormControl(''))).toBeNull();
    expect(contractDateValidator(() => '')(new FormControl('2007-12-31'))).toBeNull();
  });
});

describe('salaryValidator', () => {
  const validate = salaryValidator();

  it('accepts a positive integer', () => {
    expect(validate(new FormControl('5000'))).toBeNull();
  });

  it('accepts up to 2 decimals', () => {
    expect(validate(new FormControl('5000.50'))).toBeNull();
  });

  it('rejects more than 2 decimals', () => {
    expect(validate(new FormControl('5000.555'))).toEqual({ salary: true });
  });

  it('rejects letters', () => {
    expect(validate(new FormControl('12a45'))).toEqual({ salary: true });
  });

  it('rejects negative values', () => {
    expect(validate(new FormControl('-5'))).toEqual({ salary: true });
  });

  it('rejects zero', () => {
    expect(validate(new FormControl('0'))).toEqual({ salary: true });
  });

  it('rejects a trailing dot', () => {
    expect(validate(new FormControl('12.'))).toEqual({ salary: true });
  });

  it('ignores empty values', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});

describe('timeRangeValidator', () => {
  function group(checkIn: string, checkOut: string): FormGroup {
    return new FormGroup({
      check_in_time: new FormControl(checkIn),
      check_out_time: new FormControl(checkOut),
    });
  }

  const validate = timeRangeValidator();

  it('accepts check-out after check-in', () => {
    expect(validate(group('09:00', '17:00'))).toBeNull();
  });

  it('rejects equal times', () => {
    expect(validate(group('09:00', '09:00'))).toEqual({ timeRange: true });
  });

  it('rejects check-out before check-in', () => {
    expect(validate(group('17:00', '09:00'))).toEqual({ timeRange: true });
  });

  it('waits for both times to be filled', () => {
    expect(validate(group('09:00', ''))).toBeNull();
    expect(validate(group('', '17:00'))).toBeNull();
  });
});

describe('nonEmptyValidator', () => {
  const validate = nonEmptyValidator();

  it('rejects whitespace-only values with the required key', () => {
    expect(validate(new FormControl('   '))).toEqual({ required: true });
  });

  it('rejects empty values', () => {
    expect(validate(new FormControl(''))).toEqual({ required: true });
  });

  it('accepts trimmed text', () => {
    expect(validate(new FormControl('  John Doe '))).toBeNull();
  });
});
