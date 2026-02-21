import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface CsvColumn {
  key: string;
  header: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

@Injectable({ providedIn: 'root' })
export class ReportsCsvExportService {
  private readonly document = inject(DOCUMENT);

  exportRows(filename: string, rows: Record<string, unknown>[], columns: CsvColumn[]): void {
    if (rows.length === 0 || columns.length === 0) {
      return;
    }

    const header = columns.map((column) => this.escape(column.header)).join(',');
    const body = rows.map((row) => this.serializeRow(row, columns)).join('\n');
    const csv = `${header}\n${body}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = `${filename}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private serializeRow(row: Record<string, unknown>, columns: CsvColumn[]): string {
    return columns
      .map((column) => {
        const rawValue = row[column.key];
        const value = column.formatter ? column.formatter(rawValue, row) : this.toText(rawValue);
        return this.escape(value);
      })
      .join(',');
  }

  private toText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  private escape(value: string): string {
    const sanitized = value.replace(/"/g, '""');
    return `"${sanitized}"`;
  }
}
