import {
  formatGeneratedOn,
  formatHours,
  formatMoney,
  isCurrentMonth,
  isFuturePeriod,
  maskNationalId,
  monthlyReportFileName,
  payslipFileName,
  periodLabel,
  sumByMoneyCents,
  sumMoneyCents,
  yearlyReportFileName,
} from './payslip-pdf.util';

describe('maskNationalId', () => {
  it('masks all but the last 4 digits of a 14-digit ID', () => {
    expect(maskNationalId('12345678901234')).toBe('••••••••••1234');
  });

  it('keeps leading zeros in the visible tail', () => {
    expect(maskNationalId('00000000009999')).toBe('••••••••••9999');
  });

  it('returns a dash for empty values', () => {
    expect(maskNationalId(null)).toBe('—');
    expect(maskNationalId('')).toBe('—');
  });

  it('shows short IDs as-is', () => {
    expect(maskNationalId('1234')).toBe('1234');
    expect(maskNationalId('12')).toBe('12');
  });
});

describe('periodLabel', () => {
  it('formats a month and year as "September 2026"', () => {
    expect(periodLabel(9, 2026)).toBe('September 2026');
  });

  it('handles January', () => {
    expect(periodLabel(1, 2008)).toBe('January 2008');
  });

  it('labels out-of-range months', () => {
    expect(periodLabel(0, 2026)).toBe('Invalid month 2026');
    expect(periodLabel(13, 2026)).toBe('Invalid month 2026');
  });
});

describe('formatMoney', () => {
  it('always shows 2 decimals', () => {
    expect(formatMoney(3017.5)).toBe('3017.50');
    expect(formatMoney(0)).toBe('0.00');
    expect(formatMoney(120)).toBe('120.00');
  });

  it('treats null/undefined as zero', () => {
    expect(formatMoney(null)).toBe('0.00');
    expect(formatMoney(undefined)).toBe('0.00');
  });

  it('treats NaN as zero', () => {
    expect(formatMoney(NaN)).toBe('0.00');
  });
});

describe('formatHours', () => {
  it('always shows 2 decimals', () => {
    expect(formatHours(4)).toBe('4.00');
    expect(formatHours(2.5)).toBe('2.50');
    expect(formatHours(null)).toBe('0.00');
  });
});

describe('payslipFileName', () => {
  it('builds payslip-<name>-<YYYY-MM>.pdf', () => {
    expect(payslipFileName('John Smith', 9, 2026)).toBe('payslip-John-Smith-2026-09.pdf');
  });

  it('pads the month to two digits', () => {
    expect(payslipFileName('Ada', 3, 2026)).toBe('payslip-Ada-2026-03.pdf');
  });

  it('replaces unsafe characters with dashes', () => {
    expect(payslipFileName('Ahmed/Al:Sayed?', 1, 2026)).toBe('payslip-Ahmed-Al-Sayed-2026-01.pdf');
  });

  it('collapses whitespace into one dash and trims edges', () => {
    expect(payslipFileName('  Multi   Part Name  ', 12, 2026)).toBe(
      'payslip-Multi-Part-Name-2026-12.pdf',
    );
  });

  it('falls back to "employee" when the name is empty', () => {
    expect(payslipFileName('', 5, 2026)).toBe('payslip-employee-2026-05.pdf');
    expect(payslipFileName('///', 5, 2026)).toBe('payslip-employee-2026-05.pdf');
  });
});

describe('yearlyReportFileName', () => {
  it('builds salary-yearly-<name>-<YYYY>.pdf', () => {
    expect(yearlyReportFileName('John Smith', 2026)).toBe('salary-yearly-John-Smith-2026.pdf');
  });

  it('sanitizes unsafe characters', () => {
    expect(yearlyReportFileName('Ada/Lovelace?', 2026)).toBe('salary-yearly-Ada-Lovelace-2026.pdf');
  });

  it('falls back to "employee" when the name is empty', () => {
    expect(yearlyReportFileName('', 2026)).toBe('salary-yearly-employee-2026.pdf');
  });
});

describe('monthlyReportFileName', () => {
  it('builds salary-report-<YYYY-MM>.pdf', () => {
    expect(monthlyReportFileName(2026, 9)).toBe('salary-report-2026-09.pdf');
  });

  it('pads the month to two digits', () => {
    expect(monthlyReportFileName(2026, 1)).toBe('salary-report-2026-01.pdf');
  });
});

describe('formatGeneratedOn', () => {
  it('prefixes a formatted timestamp', () => {
    const text = formatGeneratedOn(new Date(2026, 8, 30, 14, 5).toISOString());
    expect(text).toBe('Generated on 2026-09-30 14:05');
  });

  it('falls back to now for empty input', () => {
    expect(formatGeneratedOn(null)).toMatch(/^Generated on \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('handles unparseable timestamps', () => {
    expect(formatGeneratedOn('not a date')).toBe('Generated on —');
  });
});

describe('isCurrentMonth', () => {
  it('matches the current calendar month', () => {
    const now = new Date(2026, 8, 30); // September 2026
    expect(isCurrentMonth(9, 2026, now)).toBe(true);
    expect(isCurrentMonth(8, 2026, now)).toBe(false);
    expect(isCurrentMonth(9, 2025, now)).toBe(false);
  });
});

describe('sumMoneyCents / sumByMoneyCents', () => {
  it('avoids binary floating-point drift', () => {
    expect(sumMoneyCents([0.1, 0.2])).toBe(0.3);
    expect(sumMoneyCents([0.1, 0.2])).not.toBe(0.1 + 0.2);
  });

  it('sums tricky cent values exactly', () => {
    expect(sumMoneyCents([1.005, 2.005])).toBe(3.01); // per-value rounding
    expect(sumMoneyCents([19.99, 0.01])).toBe(20);
  });

  it('treats null/undefined/NaN as zero', () => {
    expect(sumMoneyCents([null, undefined, NaN, 5])).toBe(5);
    expect(sumMoneyCents([])).toBe(0);
  });

  it('handles large totals without drift', () => {
    const values = Array.from({ length: 2000 }, () => 0.07);
    expect(sumMoneyCents(values)).toBe(140);
  });

  it('sums a picked field across objects', () => {
    const rows = [{ a: 0.1 }, { a: 0.2 }, { a: null }];
    expect(sumByMoneyCents(rows, (r) => r.a)).toBe(0.3);
  });
});

describe('isFuturePeriod', () => {
  it('detects later months in the same year', () => {
    const now = new Date(2026, 8, 30);
    expect(isFuturePeriod(10, 2026, now)).toBe(true);
    expect(isFuturePeriod(9, 2026, now)).toBe(false);
  });

  it('detects later years', () => {
    const now = new Date(2026, 8, 30);
    expect(isFuturePeriod(1, 2027, now)).toBe(true);
    expect(isFuturePeriod(12, 2025, now)).toBe(false);
  });
});
