// Pure helpers for the attendance Excel import. No Angular here so
// every case is unit-testable without the framework.

export interface ParsedImportRow {
  row: number; // 1-based position in the file (after the header)
  national_id: string | null;
  record_date: string | null; // 'YYYY-MM-DD' or null when unparseable
  check_in: string | null; // 'HH:mm' or null
  check_out: string | null; // 'HH:mm' or null
}

export interface ImportRow {
  row: number;
  national_id: string;
  record_date: string;
  check_in: string | null;
  check_out: string | null;
}

export interface SkippedRow {
  row: number;
  reason: string;
}

const ILIKE_UNSAFE = /[%_"'(),\\]/g;

export function toIlikePattern(search: string): string {
  const cleaned = search.replace(ILIKE_UNSAFE, ' ').trim();
  return cleaned ? `%${cleaned}%` : '';
}

// Excel serial dates (days since 1899-12-30) and the string forms the
// SRS allows. Returns null for anything unparseable.
export function normalizeDate(value: unknown): string | null {
  if (value == null || value === '') return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return toIsoDate(value);
  }

  if (typeof value === 'number' && isFinite(value)) {
    // Excel serial date: day 1 = 1900-01-01, with the 1900 leap-year
    // bug accounted for by the 1899-12-30 epoch.
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text) return null;

  // YYYY-MM-DD
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) {
    return buildIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  // DD/MM/YYYY
  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) {
    return buildIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
  }

  return null;
}

export function normalizeTime(value: unknown): string | 'INVALID' | null {
  if (value == null || value === '') return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return toIsoTime(value);
  }

  if (typeof value === 'number' && isFinite(value)) {
    // Excel time fraction of a day (0.5 = 12:00).
    if (value < 0 || value >= 1) return 'INVALID';
    const totalSeconds = Math.round(value * 86400);
    const h = Math.floor(totalSeconds / 3600) % 24;
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${pad(h)}:${pad(m)}`;
  }

  const text = String(value).trim();
  if (!text) return null;

  // HH:mm or HH:mm:ss
  let match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (match) {
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return 'INVALID';
    return `${pad(h)}:${pad(m)}`;
  }

  return 'INVALID';
}

export function normalizeNationalId(value: unknown): string | null {
  if (value == null) return null;

  let text: string;
  if (typeof value === 'number' && isFinite(value)) {
    // Excel drops leading zeros on numeric cells; ids are exactly 14
    // digits, so re-pad.
    text = value.toFixed(0);
  } else {
    text = String(value).trim();
    // Handles ids that arrive as "1.23457e+13" style text. Already-
    // valid 14-digit ids (leading zeros!) are never touched.
    if (text.length !== 14 && /^\d+(\.\d+)?(e\+?\d+)?$/i.test(text)) {
      text = Number(text).toFixed(0);
    }
  }

  return /^\d{14}$/.test(text) ? text : null;
}

function buildIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

function toIsoTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
