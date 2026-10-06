import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth';
import { ATTENDANCE_MESSAGES } from '../../../../core/constants/validation.constant';
import { ConfirmService } from '../../../../core/services/confirm';
import {
  ImportRow,
  SkippedRow,
  normalizeDate,
  normalizeNationalId,
  normalizeTime,
} from '../../../../shared/utils/attendance-import.util';
import { AttendanceService, ImportReport } from '../../services/attendance-service';

const CHUNK_SIZE = 500;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const PREVIEW_ROWS = 20;

const EXPECTED_HEADERS = ['national_id', 'date', 'check_in', 'check_out'];

interface PreviewRow {
  row: number;
  national_id: string;
  record_date: string;
  check_in: string | null;
  check_out: string | null;
}

@Component({
  selector: 'app-attendance-import',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './attendance-import.html',
  styleUrl: './attendance-import.css',
})
export class AttendanceImport {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly location = inject(Location);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);

  readonly attendanceMessages = ATTENDANCE_MESSAGES;

  readonly parsing = signal(false);
  readonly importing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly fileName = signal('');
  readonly previewRows = signal<PreviewRow[]>([]);
  readonly totalRows = signal(0);
  readonly report = signal<ImportReport & { skipped: (SkippedRow & { reasonKey: string })[] } | null>(null);

  readonly canEdit = signal(this.authService.hasPermission('attendance', 'edit'));

  private parsedRows: ImportRow[] = [];
  private clientSkipped: SkippedRow[] = [];

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.resetState();
    this.fileName.set(file.name);

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.errorMessage.set(this.attendanceMessages.onlyXlsx);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.errorMessage.set(this.attendanceMessages.fileTooLarge);
      return;
    }

    this.parsing.set(true);
    try {
      // exceljs is heavy — load it only when a file is actually imported.
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) {
        this.errorMessage.set(this.attendanceMessages.fileEmpty);
        return;
      }

      const result = this.parseSheet(sheet);
      this.parsedRows = result.rows;
      this.clientSkipped = result.skipped;
      this.totalRows.set(result.rows.length + result.skipped.length);
      this.previewRows.set(
        result.rows.slice(0, PREVIEW_ROWS).map((row) => ({
          row: row.row,
          national_id: row.national_id,
          record_date: row.record_date,
          check_in: row.check_in,
          check_out: row.check_out,
        })),
      );

      if (result.rows.length === 0) {
        this.errorMessage.set(this.attendanceMessages.noValidRows);
      }
    } catch {
      this.errorMessage.set(this.attendanceMessages.parseFailed);
    } finally {
      this.parsing.set(false);
    }
  }

  private parseSheet(sheet: import('exceljs').Worksheet): {
    rows: ImportRow[];
    skipped: SkippedRow[];
  } {
    const rows: ImportRow[] = [];
    const skipped: SkippedRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // header

      if (rows.length + skipped.length >= MAX_ROWS) return;

      const values = row.values as unknown[]; // 1-based; index 0 is empty
      const nationalId = normalizeNationalId(values[1]);
      const date = normalizeDate(values[2]);
      const checkIn = normalizeTime(values[3]);
      const checkOut = normalizeTime(values[4]);

      if (!nationalId) {
        skipped.push({ row: rowNumber - 1, reason: 'INVALID_NATIONAL_ID' });
        return;
      }
      if (!date) {
        skipped.push({ row: rowNumber - 1, reason: 'INVALID_DATE' });
        return;
      }
      if (checkIn === 'INVALID' || checkOut === 'INVALID') {
        skipped.push({ row: rowNumber - 1, reason: 'INVALID_TIME' });
        return;
      }
      if (!checkIn && !checkOut) {
        skipped.push({ row: rowNumber - 1, reason: 'NO_TIMES' });
        return;
      }
      if (checkIn && checkOut && checkOut <= checkIn) {
        skipped.push({ row: rowNumber - 1, reason: 'INVALID_TIME_RANGE' });
        return;
      }

      rows.push({
        row: rowNumber - 1,
        national_id: nationalId,
        record_date: date,
        check_in: checkIn || null,
        check_out: checkOut || null,
      });
    });

    return { rows, skipped };
  }

  async onDownloadTemplate(): Promise<void> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');

    sheet.addRow(EXPECTED_HEADERS);
    sheet.addRow(['12345678901234', '2026-01-05', '09:00', '17:00']);
    sheet.columns.forEach((column) => {
      column.width = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveBuffer(buffer as ArrayBuffer, 'attendance-template.xlsx');
  }

  async onImport(): Promise<void> {
    if (!this.parsedRows.length || this.importing()) return;

    const confirmed = await this.confirm.ask({
      titleKey: 'confirm.importTitle',
      messageKey: 'confirm.importMessage',
      params: { count: this.parsedRows.length },
      variant: 'info',
    });
    if (!confirmed) return;

    this.importing.set(true);
    this.errorMessage.set(null);

    try {
      let inserted = 0;
      let updated = 0;
      const skipped: SkippedRow[] = [...this.clientSkipped];

      // Chunked so one RPC never carries more than 500 rows.
      for (let i = 0; i < this.parsedRows.length; i += CHUNK_SIZE) {
        const chunk = this.parsedRows.slice(i, i + CHUNK_SIZE);
        const chunkReport = await new Promise<ImportReport>((resolve, reject) => {
          this.attendanceService.importRows(chunk).subscribe({ next: resolve, error: reject });
        });
        inserted += chunkReport.inserted;
        updated += chunkReport.updated;
        skipped.push(...(chunkReport.skipped ?? []));
      }

      this.report.set({
        inserted,
        updated,
        skipped: skipped.map((s) => ({ ...s, reasonKey: this.reasonKey(s.reason) })),
      });
    } catch (err: any) {
      const message = String(err?.message ?? '');
      if (message.includes('FORBIDDEN')) {
        this.errorMessage.set('attendance.messages.importForbidden');
      } else if (message.includes('TOO_MANY_ROWS')) {
        this.errorMessage.set(this.attendanceMessages.tooManyRows);
      } else {
        this.errorMessage.set(this.attendanceMessages.importFailed);
      }
    } finally {
      this.importing.set(false);
    }
  }

  onDownloadSkipped(): void {
    const report = this.report();
    if (!report?.skipped.length) return;

    // The CSV export stays machine-readable: raw reason code + English text.
    const lines = ['row,reason,reason_text'];
    for (const item of report.skipped) {
      lines.push(
        `${item.row},"${item.reason}","${this.reasonText(item.reasonKey).replace(/"/g, '""')}"`,
      );
    }
    saveBuffer(
      new TextEncoder().encode(lines.join('\n')).buffer as ArrayBuffer,
      'attendance-skipped.csv',
    );
  }

  goBack(): void {
    this.location.back();
  }

  /** Translation key for a skip reason (translated in the template). */
  private reasonKey(reason: string): string {
    switch (reason) {
      case 'EMPLOYEE_NOT_FOUND':
        return this.attendanceMessages.reasonEmployeeNotFound;
      case 'HOLIDAY':
        return this.attendanceMessages.reasonHoliday;
      case 'INVALID_DATE':
        return this.attendanceMessages.reasonInvalidDate;
      case 'INVALID_TIME':
      case 'INVALID_TIME_RANGE':
        return this.attendanceMessages.reasonTimeRange;
      case 'BEFORE_CONTRACT_DATE':
        return this.attendanceMessages.reasonBeforeContract;
      case 'FUTURE_DATE':
        return this.attendanceMessages.reasonFutureDate;
      case 'NO_TIMES':
        return this.attendanceMessages.reasonNoTimes;
      case 'INVALID_NATIONAL_ID':
        return this.attendanceMessages.reasonInvalidNationalId;
      default:
        return reason;
    }
  }

  /** English fallback text for the CSV export (kept machine-readable). */
  private reasonText(key: string): string {
    try {
      const english = this.translate.getTranslations('en') ?? {};
      const parts = key.split('.');
      let value: unknown = english;
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      return typeof value === 'string' ? value : key;
    } catch {
      return key;
    }
  }

  private resetState(): void {
    this.errorMessage.set(null);
    this.report.set(null);
    this.previewRows.set([]);
    this.totalRows.set(0);
    this.parsedRows = [];
    this.clientSkipped = [];
  }
}

function saveBuffer(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: filename.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
