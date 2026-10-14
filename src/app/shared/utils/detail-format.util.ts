import {
  DetailCellView,
  DetailColumn,
  DetailDisplay,
  DetailField,
  DetailFieldView,
  DetailSectionView,
  DetailsDialogConfig,
  DetailsDialogView,
} from '../../core/interfaces/details-dialog.interface';

const WESTERN_DIGITS = '-u-nu-latn';
const CAIRO = 'Africa/Cairo';
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    return current !== null && typeof current === 'object'
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, source);
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

type FormatOptions = Pick<DetailField, 'type' | 'decimals' | 'currency' | 'valueKeyPrefix'>;

// Turns one raw value into something printable. Pure: no Angular, no translation
// service (booleans and translated values return a key for the template to translate).
export function formatDetailValue(
  value: unknown,
  field: FormatOptions,
  locale: string,
): DetailDisplay {
  const base: DetailDisplay = { text: '—', ltr: false, mono: false, pre: false, empty: false };
  if (isEmpty(value)) return { ...base, empty: true };

  const type = field.type ?? 'text';
  const intlLocale = `${locale}${WESTERN_DIGITS}`;

  switch (type) {
    case 'number':
    case 'money': {
      const amount = Number(value);
      if (!Number.isFinite(amount)) return { ...base, text: String(value), ltr: true };

      const decimals = field.decimals ?? (type === 'money' ? 2 : undefined);
      const formatter = new Intl.NumberFormat(
        intlLocale,
        decimals === undefined
          ? { maximumFractionDigits: 2 }
          : { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
      );
      const currency = type === 'money' && field.currency ? ` ${field.currency}` : '';
      return { ...base, text: formatter.format(amount) + currency, ltr: true };
    }

    case 'date':
    case 'datetime': {
      const raw = String(value);
      const dateOnly = DATE_ONLY.test(raw);
      const date = new Date(dateOnly ? `${raw}T00:00:00Z` : raw);
      if (Number.isNaN(date.getTime())) return { ...base, text: raw, ltr: true };

      const formatter = new Intl.DateTimeFormat(
        intlLocale,
        type === 'datetime'
          ? { dateStyle: 'medium', timeStyle: 'medium', timeZone: CAIRO }
          : { dateStyle: 'medium', timeZone: dateOnly ? 'UTC' : CAIRO },
      );
      return { ...base, text: formatter.format(date), ltr: true };
    }

    case 'month': {
      const month = Number(value);
      if (!Number.isInteger(month) || month < 1 || month > 12) return { ...base, text: String(value) };
      const name = new Intl.DateTimeFormat(intlLocale, { month: 'long', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2000, month - 1, 1)),
      );
      return { ...base, text: name };
    }

    case 'boolean': {
      const yes = value === true || value === 'true';
      return { ...base, text: yes ? 'Yes' : 'No', textKey: yes ? 'detailsDialog.yes' : 'detailsDialog.no' };
    }

    case 'id':
      return { ...base, text: String(value), ltr: true, mono: true };

    case 'json':
      return { ...base, text: JSON.stringify(value, null, 2), ltr: true, mono: true, pre: true };

    case 'badge':
    case 'text':
    default: {
      if (typeof value === 'object') {
        return { ...base, text: JSON.stringify(value, null, 2), ltr: true, mono: true, pre: true };
      }
      const text = String(value);
      return field.valueKeyPrefix ? { ...base, text, textKey: `${field.valueKeyPrefix}${text}` } : { ...base, text };
    }
  }
}

function toFieldView(data: unknown, field: DetailField, locale: string): DetailFieldView {
  const value = getByPath(data, field.path);
  return {
    labelKey: field.labelKey,
    display: formatDetailValue(value, field, locale),
    type: field.type ?? 'text',
    suffixKey: field.suffixKey,
    tone: field.tones && !isEmpty(value) ? field.tones[String(value)] : undefined,
    span: field.span ?? 1,
    emphasis: field.emphasis ?? false,
  };
}

function toCellView(row: unknown, column: DetailColumn, locale: string): DetailCellView {
  const value = getByPath(row, column.path);
  return {
    display: formatDetailValue(value, column, locale),
    type: column.type ?? 'text',
    suffixKey: column.suffixKey,
    tone: column.tones && !isEmpty(value) ? column.tones[String(value)] : undefined,
    align: column.align ?? 'start',
  };
}

// Builds everything the template needs from the caller's config + data.
export function buildDetailsView(config: DetailsDialogConfig, locale: string): DetailsDialogView {
  const sections: DetailSectionView[] = config.sections.map((section): DetailSectionView => {
    if (section.kind === 'fields') {
      const fields = section.fields
        .map((field) => ({ field, view: toFieldView(config.data, field, locale) }))
        .filter(({ field, view }) => !(field.hideWhenEmpty && view.display.empty))
        .map(({ view }) => view);
      return { kind: 'fields', titleKey: section.titleKey, fields };
    }

    const source = getByPath(config.data, section.path);
    const rows = (Array.isArray(source) ? source : []).map((row) =>
      section.columns.map((column) => toCellView(row, column, locale)),
    );
    const footerSource = section.footerPath ? getByPath(config.data, section.footerPath) : null;
    const footer =
      footerSource && typeof footerSource === 'object'
        ? section.columns.map((column) => toCellView(footerSource, column, locale))
        : null;

    return {
      kind: 'table',
      titleKey: section.titleKey,
      columns: section.columns.map((column) => ({ labelKey: column.labelKey, align: column.align ?? 'start' })),
      rows,
      footer,
      footerLabelKey: section.footerLabelKey,
      emptyKey: section.emptyKey,
    };
  });

  return {
    title: config.title ?? null,
    titleKey: config.titleKey ?? null,
    titleParams: config.titleParams,
    subtitle: config.subtitle ?? null,
    subtitleKey: config.subtitleKey ?? null,
    highlights: (config.highlights ?? []).map((field) => toFieldView(config.data, field, locale)),
    sections,
    size: config.size ?? 'lg',
  };
}