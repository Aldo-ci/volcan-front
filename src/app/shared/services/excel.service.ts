import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

export type ExcelCellValue = string | number | boolean | Date | null | undefined;
export type ExcelRow = Record<string, ExcelCellValue>;

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  public exportAsExcelFile(rows: ExcelRow[], excelFileName: string, sheetName = 'data'): void {
    const normalizedRows = rows.map((row) => this.normalizeRow(row));
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(normalizedRows);

    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }

    worksheet['!cols'] = this.buildColumnWidths(normalizedRows);

    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private normalizeRow(row: ExcelRow): Record<string, string | number | boolean> {
    return Object.entries(row).reduce(
      (normalized, [key, value]) => {
        normalized[key] = this.normalizeValue(value);
        return normalized;
      },
      {} as Record<string, string | number | boolean>
    );
  }

  private normalizeValue(value: ExcelCellValue): string | number | boolean {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return value;
  }

  private buildColumnWidths(rows: Record<string, string | number | boolean>[]): XLSX.ColInfo[] {
    if (!rows.length) {
      return [];
    }

    const headers = Object.keys(rows[0]);
    return headers.map((header) => {
      const maxCellLength = rows.reduce((maxLength, row) => {
        const cellLength = String(row[header] ?? '').length;
        return Math.max(maxLength, cellLength);
      }, header.length);

      return { wch: Math.min(Math.max(maxCellLength + 2, 12), 60) };
    });
  }

  private saveAsExcelFile(buffer: ArrayBuffer, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + EXCEL_EXTENSION;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
