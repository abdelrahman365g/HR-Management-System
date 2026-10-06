import { SUPPORTED_LANGUAGES } from '../../core/constants/languages.constant';

/**
 * Locale-aware Intl formatting helpers. They follow the active language
 * but always keep Western digits (`numberingSystem: 'latn'`) in both
 * English and Arabic.
 */
export function localeFor(lang: string): string {
  return lang === 'ar' ? 'ar-EG' : 'en-US';
}

/** Formats an ISO date (yyyy-mm-dd) as a localized date, Western digits. */
export function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeFor(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn',
  } as Intl.DateTimeFormatOptions).format(date);
}

/** Formats a full date + time, Western digits. */
export function formatDateTime(value: string | null | undefined, lang: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeFor(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  } as Intl.DateTimeFormatOptions).format(date);
}

/** Localized month name (1-12) from Intl. */
export function monthName(month: number, lang: string): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    month: 'long',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  } as Intl.DateTimeFormatOptions).format(new Date(Date.UTC(2024, month - 1, 1)));
}

/** Localized weekday name from a day index (0 = Sunday). */
export function weekdayName(dayIndex: number, lang: string): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    weekday: 'long',
    timeZone: 'UTC',
    numberingSystem: 'latn',
  } as Intl.DateTimeFormatOptions).format(new Date(Date.UTC(2024, 0, 7 + dayIndex)));
}

/** Money formatting with the currency code appended (Western digits). */
export function formatMoney(value: number, lang: string, currency = 'EGP'): string {
  const formatted = new Intl.NumberFormat(localeFor(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    numberingSystem: 'latn',
  } as Intl.NumberFormatOptions).format(value ?? 0);
  return `${formatted} ${currency}`;
}

/** Plain number formatting (grouping separators), Western digits. */
export function formatNumber(value: number, lang: string): string {
  return new Intl.NumberFormat(localeFor(lang), {
    numberingSystem: 'latn',
  } as Intl.NumberFormatOptions).format(value ?? 0);
}

/** Localized long date, e.g. "Wednesday, October 1, 2026". */
export function formatToday(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    numberingSystem: 'latn',
  } as Intl.DateTimeFormatOptions).format(date);
}

/** Returns true when the code is one of SUPPORTED_LANGUAGES. */
export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}
