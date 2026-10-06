// jsPDF drawing for the Phase 5 salary PDFs. All data shaping lives in
// payslip-pdf.util.ts (pure, unit-tested); this module only draws. The
// heavy libraries are imported dynamically (see loadPdf/loadAutoTable)
// so they stay out of the initial bundle and only load on Print clicks.
import type { jsPDF } from 'jspdf';
import {
  SalaryReportRow,
  YearlySalaryReport,
} from '../../../core/interfaces/salary-report.interface';
// PDFs stay English, so month labels here are English-only.
const PDF_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
import { formatGeneratedOn, formatMoney, maskNationalId } from '../../../shared/utils/payslip-pdf.util';

// Dynamically imported so they stay out of the initial bundle.
export async function loadPdf(): Promise<typeof jsPDF> {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

type AutoTableFn = (doc: jsPDF, options: Record<string, unknown>) => void;

export async function loadAutoTable(): Promise<AutoTableFn> {
  const { default: autoTable } = await import('jspdf-autotable');
  return autoTable as unknown as AutoTableFn;
}

const PAGE_MARGIN = 12;

/** Shared landscape header. Returns the y position after the header. */
function drawReportHeader(doc: jsPDF, companyName: string, title: string, subtitleLines: string[]): number {
  doc.setFontSize(14);
  doc.text(companyName, PAGE_MARGIN, 12);
  doc.setFontSize(12);
  doc.text(title, PAGE_MARGIN, 19);
  doc.setFontSize(9);
  let y = 26;
  for (const line of subtitleLines) {
    doc.text(line, PAGE_MARGIN, y);
    y += 5;
  }
  return y + 2;
}

/** Draws the "Page x of y" footer on every page. */
function drawPageNumbers(doc: jsPDF, pageOfTemplate: string): void {
  const pages = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      pageOfTemplate.replace('{x}', String(i)).replace('{y}', String(pages)),
      width - PAGE_MARGIN,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'right' },
    );
  }
}

export interface MonthlyReportPdfInput {
  companyName: string;
  title: string;
  periodLabel: string;
  filterDescription: string;
  generatedOn: string | null;
  pageOfTemplate: string;
  fileName: string;
  rows: SalaryReportRow[];
}

/**
 * Builds and saves the A4-landscape monthly listing PDF. Column totals
 * are summed in integer cents (never plain floating-point addition).
 */
export async function buildMonthlyReportPdf(input: MonthlyReportPdfInput): Promise<void> {
  const JsPDF = await loadPdf();
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const autoTable = await loadAutoTable();

  drawReportHeader(doc, input.companyName, input.title, [
    `Period: ${input.periodLabel}`,
    `Filters: ${input.filterDescription}`,
    formatGeneratedOn(input.generatedOn),
  ]);

  const body = input.rows.map((r) => [
    r.employee_name,
    r.department_name,
    formatMoney(r.base_salary),
    String(r.attendance_days),
    String(r.absence_days),
    String(r.not_employed_days),
    formatMoney(r.overtime_hours),
    formatMoney(r.deduction_hours),
    formatMoney(r.total_overtime_amount),
    formatMoney(r.total_deduction_amount),
    formatMoney(r.total_absence_amount),
    formatMoney(r.net_salary),
  ]);

  // Integer-cents column sums — immune to 0.1 + 0.2 drift.
  const pick = (get: (r: SalaryReportRow) => number) =>
    input.rows.reduce((acc, r) => acc + Math.round((get(r) || 0) * 100), 0) / 100;

  const totals = [
    'Totals',
    '',
    formatMoney(pick((r) => r.base_salary)),
    '',
    '',
    '',
    formatMoney(pick((r) => r.overtime_hours)),
    formatMoney(pick((r) => r.deduction_hours)),
    formatMoney(pick((r) => r.total_overtime_amount)),
    formatMoney(pick((r) => r.total_deduction_amount)),
    formatMoney(pick((r) => r.total_absence_amount)),
    formatMoney(pick((r) => r.net_salary)),
  ];

  autoTable(doc, {
    startY: 42,
    // The column header repeats on every page automatically.
    head: [
      [
        'Employee',
        'Department',
        'Base salary',
        'Att. days',
        'Abs. days',
        'Days before joining',
        'OT hours',
        'Ded. hours',
        'Total OT',
        'Late/early deduction',
        'Absence deduction',
        'Net salary',
      ],
    ],
    body,
    foot: [totals],
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [55, 65, 81], fontSize: 7 },
    footStyles: { fontStyle: 'bold', fillColor: [229, 231, 235], textColor: 20 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: 36 },
  });

  drawPageNumbers(doc, input.pageOfTemplate);
  doc.save(input.fileName);
}

export interface YearlyReportPdfInput {
  companyName: string;
  currencyCode: string;
  pageOfTemplate: string;
  liveNotice: string;
  snapshotCoverageTemplate: string;
  fileName: string;
  generatedOn: string | null;
  report: YearlySalaryReport;
}

/** Builds and saves the A4-landscape yearly report PDF. */
export async function buildYearlyReportPdf(input: YearlyReportPdfInput): Promise<void> {
  const JsPDF = await loadPdf();
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const autoTable = await loadAutoTable();
  const { employee, year, months, totals } = input.report;

  drawReportHeader(doc, input.companyName, 'Yearly Salary Report', [
    `Employee: ${employee.name}`,
    `National ID: ${maskNationalId(employee.national_id)}`,
    `Department: ${employee.department_name}`,
    `Year: ${year}`,
    formatGeneratedOn(input.generatedOn),
  ]);

  const body = months.map((m) => [
    PDF_MONTH_NAMES[m.month - 1] ?? String(m.month),
    String(m.attendance_days),
    String(m.absence_days),
    String(m.not_employed_days),
    formatMoney(m.overtime_hours),
    formatMoney(m.deduction_hours),
    formatMoney(m.base_salary),
    formatMoney(m.total_overtime_amount),
    formatMoney(m.total_deduction_amount),
    formatMoney(m.total_absence_amount),
    formatMoney(m.net_salary),
    m.source === 'snapshot' ? 'Saved' : 'Live',
  ]);

  const totalsRow = [
    'Totals',
    String(totals.attendance_days),
    String(totals.absence_days),
    String(totals.not_employed_days),
    formatMoney(totals.overtime_hours),
    formatMoney(totals.deduction_hours),
    formatMoney(totals.total_base_salary),
    formatMoney(totals.total_overtime_amount),
    formatMoney(totals.total_deduction_amount),
    formatMoney(totals.total_absence_amount),
    formatMoney(totals.total_net_salary),
    '',
  ];

  autoTable(doc, {
    startY: 52,
    // The column header repeats on every page automatically.
    head: [
      [
        'Month',
        'Att. days',
        'Abs. days',
        'Days before joining',
        'OT hours',
        'Ded. hours',
        `Base salary (${input.currencyCode})`,
        `Total OT (${input.currencyCode})`,
        `Late/early deduction (${input.currencyCode})`,
        `Absence deduction (${input.currencyCode})`,
        `Net salary (${input.currencyCode})`,
        'Source',
      ],
    ],
    body,
    foot: [totalsRow],
    styles: { fontSize: 8, cellPadding: 1.4 },
    headStyles: { fillColor: [55, 65, 81], fontSize: 8 },
    footStyles: { fontStyle: 'bold', fillColor: [229, 231, 235], textColor: 20 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: 46 },
  });

  // Summary block under the table.
  const finalY =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 120) + 8;
  const summary: [string, string][] = [
    ['Total net salary', formatMoney(totals.total_net_salary)],
    ['Total overtime', formatMoney(totals.total_overtime_amount)],
    ['Total late/early deduction', formatMoney(totals.total_deduction_amount)],
    ['Total absence deduction', formatMoney(totals.total_absence_amount)],
    ['Total attendance days', String(totals.attendance_days)],
    ['Total absence days', String(totals.absence_days)],
  ];
  let y = finalY;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', PAGE_MARGIN, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  for (const [label, value] of summary) {
    doc.text(`${label}: ${value} ${input.currencyCode}`, PAGE_MARGIN, y);
    y += 5;
  }

  if (totals.includes_current_month) {
    doc.setTextColor(180, 60, 0);
    doc.text(input.liveNotice, PAGE_MARGIN, y + 2);
    doc.setTextColor(0);
  } else if (totals.snapshot_months < totals.months_count) {
    doc.setTextColor(90, 90, 90);
    doc.text(
      input.snapshotCoverageTemplate
        .replace('{n}', String(totals.snapshot_months))
        .replace('{m}', String(totals.months_count)),
      PAGE_MARGIN,
      y + 2,
    );
    doc.setTextColor(0);
  }

  drawPageNumbers(doc, input.pageOfTemplate);
  doc.save(input.fileName);
}
