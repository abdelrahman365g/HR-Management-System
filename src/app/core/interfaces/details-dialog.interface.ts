export type DetailValueType =
  | 'text'
  | 'number'
  | 'money'
  | 'date' // calendar date (YYYY-MM-DD) or ISO timestamp, shown as a date
  | 'datetime' // ISO timestamp, shown in Cairo time
  | 'month' // 1-12, shown as the month name
  | 'boolean'
  | 'id' // uuid / national id: monospace, always left-to-right
  | 'json' // objects and arrays, pretty printed
  | 'badge'; // small colored chip

export type DetailTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface DetailField {
  /** Dot path into `data`, e.g. 'employee.name'. */
  path: string;
  /** Translation key of the label. */
  labelKey: string;
  type?: DetailValueType;
  /** number/money: fixed decimals (money defaults to 2). */
  decimals?: number;
  /** money: currency code appended to the amount, e.g. 'EGP'. */
  currency?: string;
  /** Translation key appended after the value, e.g. a "hours" unit. */
  suffixKey?: string;
  /** Translate the value itself: the key is `${valueKeyPrefix}${value}`. */
  valueKeyPrefix?: string;
  /** badge: maps a raw value to a color. */
  tones?: Record<string, DetailTone>;
  /** 2 = take the full row of the grid. */
  span?: 1 | 2;
  /** Big, bold value (for the one number the reader came for). */
  emphasis?: boolean;
  hideWhenEmpty?: boolean;
}

export interface DetailColumn
  extends Omit<DetailField, 'span' | 'emphasis' | 'hideWhenEmpty'> {
  align?: 'start' | 'end';
}

export interface DetailFieldsSection {
  kind: 'fields';
  titleKey?: string;
  fields: DetailField[];
}

export interface DetailTableSection {
  kind: 'table';
  titleKey?: string;
  /** Dot path to an array of row objects inside `data`. */
  path: string;
  columns: DetailColumn[];
  /** Dot path to ONE object shaped like a row; shown as a bold totals row. */
  footerPath?: string;
  /** Replaces the first footer cell, e.g. a "Total" label. */
  footerLabelKey?: string;
  /** Shown when the array is empty. */
  emptyKey?: string;
}

export type DetailSection = DetailFieldsSection | DetailTableSection;

export interface DetailsDialogConfig<T = unknown> {
  /** Already-final text (e.g. an employee name) ... */
  title?: string;
  /** ... or a translation key (with optional params). */
  titleKey?: string;
  titleParams?: Record<string, unknown>;
  subtitle?: string;
  subtitleKey?: string;
  /** The object whose properties are listed. The dialog never mutates it. */
  data: T;
  /** Big tiles shown first: the few values worth seeing at a glance. */
  highlights?: DetailField[];
  sections: DetailSection[];
  size?: 'md' | 'lg' | 'xl';
}

// ---------------------------------------------------------------------------
// Ready-to-render view models (built by buildDetailsView, a pure function)
// ---------------------------------------------------------------------------

export interface DetailDisplay {
  text: string;
  /** When set, the template translates this key instead of showing `text`. */
  textKey?: string;
  ltr: boolean;
  mono: boolean;
  /** Pre-formatted block (json). */
  pre: boolean;
  empty: boolean;
}

export interface DetailFieldView {
  labelKey: string;
  display: DetailDisplay;
  type: DetailValueType;
  suffixKey?: string;
  tone?: DetailTone;
  span: 1 | 2;
  emphasis: boolean;
}

export interface DetailCellView {
  display: DetailDisplay;
  type: DetailValueType;
  suffixKey?: string;
  tone?: DetailTone;
  align: 'start' | 'end';
}

export interface DetailFieldsSectionView {
  kind: 'fields';
  titleKey?: string;
  fields: DetailFieldView[];
}

export interface DetailTableSectionView {
  kind: 'table';
  titleKey?: string;
  columns: { labelKey: string; align: 'start' | 'end' }[];
  rows: DetailCellView[][];
  footer: DetailCellView[] | null;
  footerLabelKey?: string;
  emptyKey?: string;
}

export type DetailSectionView = DetailFieldsSectionView | DetailTableSectionView;

export interface DetailsDialogView {
  title: string | null;
  titleKey: string | null;
  titleParams: Record<string, unknown> | undefined;
  subtitle: string | null;
  subtitleKey: string | null;
  highlights: DetailFieldView[];
  sections: DetailSectionView[];
  size: 'md' | 'lg' | 'xl';
}