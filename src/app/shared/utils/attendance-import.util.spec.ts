import {
  normalizeDate,
  normalizeNationalId,
  normalizeTime,
  toIlikePattern,
} from './attendance-import.util';

describe('toIlikePattern', () => {
  it('wraps clean text with wildcards', () => {
    expect(toIlikePattern('john')).toBe('%john%');
  });

  it('strips embedded % wildcards from the search text', () => {
    expect(toIlikePattern('%jo%hn%')).toBe('%jo hn%');
  });

  it('strips quotes and commas', () => {
    expect(toIlikePattern("o'connor, jr")).toBe('%o connor  jr%');
  });

  it('returns empty for unsafe-only input', () => {
    expect(toIlikePattern('%"()\\')).toBe('');
  });
});

describe('normalizeDate', () => {
  it('passes through ISO dates', () => {
    expect(normalizeDate('2026-03-01')).toBe('2026-03-01');
  });

  it('parses DD/MM/YYYY strings', () => {
    expect(normalizeDate('01/03/2026')).toBe('2026-03-01');
  });

  it('parses real Excel dates (serial numbers)', () => {
    // 2026-03-01 = 46082 days after 1899-12-30.
    expect(normalizeDate(46082)).toBe('2026-03-01');
  });

  it('parses Date objects', () => {
    expect(normalizeDate(new Date(2026, 2, 1))).toBe('2026-03-01');
  });

  it('rejects impossible dates', () => {
    expect(normalizeDate('2026-02-31')).toBeNull();
    expect(normalizeDate('31/02/2026')).toBeNull();
  });

  it('rejects garbage', () => {
    expect(normalizeDate('not a date')).toBeNull();
    expect(normalizeDate(true)).toBeNull();
  });

  it('returns null for empty values', () => {
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate(null)).toBeNull();
  });
});

describe('normalizeTime', () => {
  it('passes through HH:mm strings', () => {
    expect(normalizeTime('09:30')).toBe('09:30');
  });

  it('normalizes single-digit hours', () => {
    expect(normalizeTime('9:05')).toBe('09:05');
  });

  it('trims seconds', () => {
    expect(normalizeTime('17:45:12')).toBe('17:45');
  });

  it('parses Excel time fractions', () => {
    expect(normalizeTime(0.5)).toBe('12:00');
    expect(normalizeTime(0.25)).toBe('06:00');
  });

  it('parses Date objects', () => {
    expect(normalizeTime(new Date(2026, 0, 1, 8, 15))).toBe('08:15');
  });

  it('rejects out-of-range times', () => {
    expect(normalizeTime('24:00')).toBe('INVALID');
    expect(normalizeTime('09:60')).toBe('INVALID');
    expect(normalizeTime(1.5)).toBe('INVALID');
  });

  it('rejects garbage', () => {
    expect(normalizeTime('abc')).toBe('INVALID');
  });

  it('returns null for empty values', () => {
    expect(normalizeTime('')).toBeNull();
    expect(normalizeTime(null)).toBeNull();
  });
});

describe('normalizeNationalId', () => {
  it('accepts 14-digit strings', () => {
    expect(normalizeNationalId('12345678901234')).toBe('12345678901234');
  });

  it('preserves leading zeros on text ids', () => {
    expect(normalizeNationalId('00000000000042')).toBe('00000000000042');
  });

  it('re-pads numeric ids Excel stripped', () => {
    expect(normalizeNationalId(12345678901234)).toBe('12345678901234');
  });

  it('re-pads numeric ids sent as text numbers', () => {
    expect(normalizeNationalId('1.2345678901234e+13')).toBe('12345678901234');
  });

  it('rejects wrong lengths', () => {
    expect(normalizeNationalId('1234567890123')).toBeNull();
    expect(normalizeNationalId('123456789012345')).toBeNull();
  });

  it('rejects letters', () => {
    expect(normalizeNationalId('12a45678901234')).toBeNull();
  });

  it('returns null for empty values', () => {
    expect(normalizeNationalId('')).toBeNull();
    expect(normalizeNationalId(null)).toBeNull();
  });
});
