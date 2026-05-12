import { Injectable, inject } from '@angular/core';
import { Observable, map, take } from 'rxjs';
import { ExcelCellValue, ExcelRow, ExcelService } from './excel.service';
import { ToastService } from './toast.service';

export interface TableExportOptions<T> {
  rows$: Observable<T[]>;
  fileName: string;
  mapRow: (row: T) => Record<string, ExcelCellValue>;
  successMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TableExportService {
  private readonly excelService = inject(ExcelService);
  private readonly toast = inject(ToastService);

  exportRows<T>(options: TableExportOptions<T>): void {
    options.rows$
      .pipe(
        take(1),
        map((rows) => rows.map((row) => options.mapRow(row) as ExcelRow))
      )
      .subscribe({
        next: (rows) => {
          if (!rows.length) {
            this.toast.error(options.emptyMessage ?? 'No hay datos para exportar.');
            return;
          }

          this.excelService.exportAsExcelFile(rows, this.withDateSuffix(options.fileName));
          this.toast.success(options.successMessage ?? 'Archivo exportado correctamente.');
        },
        error: () => {
          this.toast.error(options.errorMessage ?? 'No se pudo exportar la información.');
        }
      });
  }

  private withDateSuffix(fileName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${fileName}_${year}-${month}-${day}`;
  }
}
