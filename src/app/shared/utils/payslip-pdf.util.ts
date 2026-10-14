// Pure helpers for the payslip PDF (Phase 5). No Angular and no
// salary formulas here — the database stays the single source of
// truth for calculations; these only format values that already came
// from the salary report RPC. Everything is unit-testable.

// PDFs stay English (jsPDF cannot render Arabic without an embedded
// Arabic font and shaping), so month labels here are English-only.
const PDF_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Masks a national ID, keeping only the last 4 digits visible. */
export function maskNationalId(nationalId: string | null | undefined): string {
  if (!nationalId) return '—';
  const id = String(nationalId);
  if (id.length <= 4) return id;
  return '*'.repeat(id.length - 4) + id.slice(-4);
}

/** "September 2026" style label for a (month 1-12, year) period. */
export function periodLabel(month: number, year: number): string {
  const name = month >= 1 && month <= 12 ? PDF_MONTH_NAMES[month - 1] : 'Invalid month';
  return `${name} ${year}`;
}

/** Money with exactly 2 decimals, e.g. 3017.5 -> "3017.50". */
export function formatMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return (isFinite(n) ? n : 0).toFixed(2);
}

/** Hours with exactly 2 decimals, e.g. 4 -> "4.00". */
export function formatHours(value: number | null | undefined): string {
  return formatMoney(value);
}

/** "Generated on 2026-09-30 14:05" from a timestamp (defaults to now). */
export function formatGeneratedOn(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  if (isNaN(date.getTime())) return 'Generated on —';
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
  return `Generated on ${stamp}`;
}

/**
 * payslip-<employee-name>-<YYYY-MM>.pdf — name characters that are
 * unsafe in filenames become dashes; consecutive dashes collapse.
 */
export function payslipFileName(employeeName: string, month: number, year: number): string {
  const safeName = safeFilePart(employeeName);
  const mm = String(month).padStart(2, '0');
  return `payslip-${safeName}-${year}-${mm}.pdf`;
}

/** salary-yearly-<employee-name>-<YYYY>.pdf */
export function yearlyReportFileName(employeeName: string, year: number): string {
  return `salary-yearly-${safeFilePart(employeeName)}-${year}.pdf`;
}

/** salary-report-<YYYY-MM>.pdf (monthly listing, no employee name). */
export function monthlyReportFileName(year: number, month: number): string {
  return `salary-report-${year}-${String(month).padStart(2, '0')}.pdf`;
}

function safeFilePart(employeeName: string): string {
  const safeName = (employeeName || 'employee')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safeName || 'employee';
}

/** True when (month, year) is the current calendar month. */
export function isCurrentMonth(month: number, year: number, now = new Date()): boolean {
  return month === now.getMonth() + 1 && year === now.getFullYear();
}

/** True when (month, year) is after the current calendar month. */
export function isFuturePeriod(month: number, year: number, now = new Date()): boolean {
  if (year !== now.getFullYear()) return year > now.getFullYear();
  return month > now.getMonth() + 1;
}

/**
 * Sums money values exactly using integer cents — immune to binary
 * floating-point drift (0.1 + 0.2 = 0.30000000000000004 in plain JS).
 * Each value is rounded to the nearest cent first; the result is a
 * decimal with 2 places.
 */
export function sumMoneyCents(values: Array<number | null | undefined>): number {
  let cents = 0;
  for (const value of values) {
    const n = Number(value ?? 0);
    cents += isFinite(n) ? Math.round(n * 100) : 0;
  }
  return cents / 100;
}

/** Extracts one numeric field from every object and sums it in cents. */
export function sumByMoneyCents<T>(items: T[], pick: (item: T) => number | null | undefined): number {
  return sumMoneyCents(items.map(pick));
}
