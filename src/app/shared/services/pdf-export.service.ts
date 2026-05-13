import { Injectable, inject } from '@angular/core';
import { Observable, take } from 'rxjs';
import { ToastService } from './toast.service';

export interface PdfExportOptions<T> {
  rows$: Observable<T[]>;
  fileName: string;
  title: string;
  columns: { header: string; data: (row: T) => string | number | boolean }[];
  successMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  private readonly toast = inject(ToastService);

  exportRows<T>(options: PdfExportOptions<T>): void {
    options.rows$
      .pipe(
        take(1),
      )
      .subscribe({
        next: async (rows) => {
          if (!rows.length) {
            this.toast.error(options.emptyMessage ?? 'No hay datos para exportar.');
            return;
          }

          try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
              import('jspdf'),
              import('jspdf-autotable'),
            ]);
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(options.title, 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Fecha de generación: ${new Date().toLocaleString('es-MX')}`, 14, 30);

            autoTable(doc, {
              startY: 35,
              head: [options.columns.map(col => col.header)],
              body: rows.map(row => options.columns.map(col => col.data(row))),
              styles: { fontSize: 9 },
              headStyles: { fillColor: [63, 81, 181] },
            });

            doc.save(`${this.withDateSuffix(options.fileName)}.pdf`);
            this.toast.success(options.successMessage ?? 'Archivo PDF exportado correctamente.');
          } catch {
            this.toast.error(options.errorMessage ?? 'No se pudo exportar la información a PDF.');
          }
        },
        error: () => {
          this.toast.error(options.errorMessage ?? 'No se pudo exportar la información a PDF.');
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
