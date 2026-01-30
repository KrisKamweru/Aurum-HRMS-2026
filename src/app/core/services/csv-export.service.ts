import { Injectable } from '@angular/core';

export interface CsvColumn {
  key: string;
  header: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {

  /**
   * Exports data to a CSV file and triggers browser download
   */
  exportToCsv(
    data: Record<string, unknown>[],
    columns: CsvColumn[],
    filename: string
  ): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csvContent = this.generateCsvContent(data, columns);
    this.downloadCsv(csvContent, filename);
  }

  /**
   * Generates CSV content string from data and column definitions
   */
  private generateCsvContent(
    data: Record<string, unknown>[],
    columns: CsvColumn[]
  ): string {
    const headers = columns.map(col => this.escapeCsvValue(col.header));
    const headerRow = headers.join(',');

    const dataRows = data.map(row => {
      return columns.map(col => {
        const rawValue = this.getNestedValue(row, col.key);
        const formattedValue = col.formatter
          ? col.formatter(rawValue, row)
          : this.formatValue(rawValue);
        return this.escapeCsvValue(formattedValue);
      }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Gets a nested value from an object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Formats a value for CSV output
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }

  /**
   * Formats a date to YYYY-MM-DD format
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Escapes a value for CSV (handles commas, quotes, newlines)
   */
  private escapeCsvValue(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Check if value needs quoting
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escape double quotes by doubling them
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return stringValue;
  }

  /**
   * Triggers browser download of CSV content
   */
  private downloadCsv(csvContent: string, filename: string): void {
    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Formats currency values for CSV export
   */
  formatCurrency(value: unknown, currency = 'KES'): string {
    if (value === null || value === undefined) {
      return '';
    }
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) {
      return '';
    }
    return `${currency} ${numValue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Formats time values (HH:MM) for CSV export
   */
  formatTime(isoString: unknown): string {
    if (!isoString || typeof isoString !== 'string') {
      return '';
    }
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }

  /**
   * Formats duration in minutes to HH:MM format
   */
  formatDuration(minutes: unknown): string {
    if (minutes === null || minutes === undefined) {
      return '';
    }
    const mins = typeof minutes === 'number' ? minutes : parseInt(String(minutes), 10);
    if (isNaN(mins)) {
      return '';
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${String(remainingMins).padStart(2, '0')}`;
  }
}
