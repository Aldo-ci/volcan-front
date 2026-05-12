import { Component, OnInit, inject, signal } from '@angular/core';
import { Sale, SaleService } from './sale.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastService } from '../../shared/services/toast.service';
import { SaleDetailComponent } from './sale-detail.component';
import { AuthService } from '../../core/auth/auth.service';
import { TableExportService } from '../../shared/services/table-export.service';
import { PdfExportService } from '../../shared/services/pdf-export.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceiptPrintService } from './receipt-print.service';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    CurrencyPipe,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
        @if (isAdmin()) {
          <div class="flex gap-2">
            <button mat-stroked-button color="primary" (click)="exportAsXLSX()">
              <mat-icon>download</mat-icon>
              Exportar a Excel
            </button>
            <button mat-stroked-button color="accent" (click)="exportAsPDF()">
              <mat-icon>picture_as_pdf</mat-icon>
              Exportar a PDF
            </button>
          </div>
        }
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full lg:w-auto">
            <mat-form-field appearance="outline" class="w-full md:w-64">
              <mat-label>Desde</mat-label>
              <input
                matInput
                [matDatepicker]="fromPicker"
                readonly
                [value]="fromDate()"
                (dateChange)="onFromDateChange($event)"
                (click)="fromPicker.open()"
              />
              <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full md:w-64">
              <mat-label>Hasta</mat-label>
              <input
                matInput
                [matDatepicker]="toPicker"
                readonly
                [value]="toDate()"
                (dateChange)="onToDateChange($event)"
                (click)="toPicker.open()"
              />
              <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="flex items-center justify-end gap-2 w-full lg:w-auto pb-1">
            <button mat-stroked-button (click)="clearDateFilter()">
              <mat-icon>restart_alt</mat-icon>
              Limpiar
            </button>
            <button mat-flat-button color="primary" (click)="applyDateFilter()">
              <mat-icon>search</mat-icon>
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="sales()" class="w-full">
          
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let element">{{element.occurredAt | date:'dd/MM/yyyy, hh:mm a'}}</td>
          </ng-container>

          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID Ticket</th>
            <td mat-cell *matCellDef="let element" class="text-xs text-gray-500 font-mono">{{element.id.substring(0, 8)}}...</td>
          </ng-container>

          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let element" class="font-bold">{{element.total | currency}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let element">
              @if (element.status === 'completed') {
                <mat-chip class="!bg-green-100 !text-green-800">Completada</mat-chip>
              } @else {
                <mat-chip class="!bg-red-100 !text-red-800">Cancelada</mat-chip>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="openDetail(element)">
                  <mat-icon>visibility</mat-icon>
                  <span>Ver Detalle</span>
                </button>
                @if (element.status === 'completed') {
                  <button mat-menu-item (click)="reprintSale(element)">
                    <mat-icon>print</mat-icon>
                    <span>Reimprimir ticket</span>
                  </button>
                }
                @if (element.status === 'completed' && isAdmin()) {
                  <button mat-menu-item class="!text-red-600" (click)="cancelSale(element)">
                    <mat-icon class="!text-red-600">cancel</mat-icon>
                    <span>Cancelar Venta</span>
                  </button>
                }
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <mat-paginator 
          [length]="total()"
          [pageSize]="limit()"
          [pageSizeOptions]="[5, 10, 25, 100]"
          (page)="onPageChange($event)">
        </mat-paginator>
      </div>
    </div>
  `
})
export class SalesListComponent implements OnInit {
  private readonly saleService = inject(SaleService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly tableExportService = inject(TableExportService);
  private readonly pdfExportService = inject(PdfExportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly receiptPrintService = inject(ReceiptPrintService);

  sales = signal<Sale[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  fromDate = signal<Date | null>(null);
  toDate = signal<Date | null>(null);
  
  isAdmin = this.authService.isAdmin;
  displayedColumns: string[] = ['date', 'id', 'total', 'status', 'actions'];

  ngOnInit() {
    this.restoreFilterFromQueryParams();
    this.loadData();
  }

  loadData() {
    const apiRange = this.getApiDateRange();
    if (apiRange === null) return;

    this.saleService.getAll({ page: this.page(), limit: this.limit(), ...apiRange }).subscribe(res => {
      this.sales.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  exportAsXLSX(): void {
    const apiRange = this.getApiDateRange();
    if (apiRange === null) return;

    this.tableExportService.exportRows({
      rows$: this.saleService.getAllUnpaginated(apiRange),
      fileName: 'ventas',
      mapRow: (sale) => {
        const items = sale.items.map(i => `${i.quantity} x ${i.productNameSnapshot}`).join(', ');
        return {
          Id: sale.id,
          Fecha: new Date(sale.occurredAt).toLocaleString('es-MX'),
          Total: Number(sale.total),
          Estado: sale.status === 'completed' ? 'Completada' : 'Cancelada',
          'Usuario (ID)': sale.createdByUserId,
          Productos: items || 'Sin productos'
        };
      },
      successMessage: 'Ventas exportadas correctamente.',
      errorMessage: 'No se pudieron exportar las ventas.'
    });
  }

  exportAsPDF(): void {
    const apiRange = this.getApiDateRange();
    if (apiRange === null) return;

    this.pdfExportService.exportRows({
      rows$: this.saleService.getAllUnpaginated(apiRange),
      fileName: 'ventas',
      title: 'Reporte de Ventas',
      columns: [
        { header: 'ID Ticket', data: (s) => s.id.substring(0, 8) },
        { header: 'Fecha', data: (s) => new Date(s.occurredAt).toLocaleString('es-MX') },
        { header: 'Total', data: (s) => `${s.total}` },
        { header: 'Estado', data: (s) => s.status === 'completed' ? 'Completada' : 'Cancelada' },
        { header: 'Usuario', data: (s) => s.createdByUserId },
        { header: 'Productos', data: (s) => s.items.map(i => `${i.quantity}x${i.productNameSnapshot}`).join(', ') }
      ],
      successMessage: 'Ventas exportadas a PDF correctamente.',
      errorMessage: 'No se pudieron exportar las ventas a PDF.'
    });
  }

  onFromDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.fromDate.set(event.value ?? null);
  }

  onToDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.toDate.set(event.value ?? null);
  }

  applyDateFilter(): void {
    if (this.getApiDateRange() === null) return;

    this.page.set(1);
    this.syncFiltersToQueryParams();
    this.loadData();
  }

  clearDateFilter(): void {
    this.fromDate.set(null);
    this.toDate.set(null);
    this.page.set(1);
    this.syncFiltersToQueryParams();
    this.loadData();
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadData();
  }

  private restoreFilterFromQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const from = params.get('from') ?? '';
    const to = params.get('to') ?? '';

    if (from && !this.isValidDateInput(from)) {
      this.toast.error('El parámetro "from" no es una fecha válida.');
    } else {
      this.fromDate.set(from ? this.parseDateParam(from) : null);
    }

    if (to && !this.isValidDateInput(to)) {
      this.toast.error('El parámetro "to" no es una fecha válida.');
    } else {
      this.toDate.set(to ? this.parseDateParam(to) : null);
    }
  }

  private syncFiltersToQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: this.formatDateParam(this.fromDate()),
        to: this.formatDateParam(this.toDate())
      },
      queryParamsHandling: 'merge'
    });
  }

  private getApiDateRange(): { from?: string; to?: string } | null {
    let fromIso: string | undefined;
    let toIso: string | undefined;

    const fromRaw = this.fromDate();
    const toRaw = this.toDate();

    if (fromRaw) {
      const fromStart = this.toLocalDateStart(fromRaw);
      fromIso = fromStart.toISOString();
    }

    if (toRaw) {
      const toEnd = this.toLocalDateEnd(toRaw);
      toIso = toEnd.toISOString();
    }

    if (fromIso && toIso && fromIso > toIso) {
      this.toast.error('La fecha "desde" no puede ser mayor a "hasta".');
      return null;
    }

    return {
      from: fromIso,
      to: toIso
    };
  }

  private isValidDateInput(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  private parseDateParam(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private formatDateParam(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toLocalDateStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private toLocalDateEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  openDetail(sale: Sale) {
    // Ideally we fetch full detail by ID to ensure we have all items populated
    this.saleService.getById(sale.id).subscribe(fullSale => {
      this.dialog.open(SaleDetailComponent, {
        data: { sale: fullSale },
        width: '600px'
      });
    });
  }

  reprintSale(sale: Sale) {
    this.saleService.getById(sale.id).subscribe({
      next: fullSale => {
        this.receiptPrintService.reprintSale(fullSale).subscribe({
          next: () => {
            this.toast.success('Ticket reimpreso con éxito.');
          },
          error: () => {
            this.toast.error('No se pudo reimprimir el ticket.');
          }
        });
      },
      error: () => {
        this.toast.error('No se pudo cargar el detalle de la venta.');
      }
    });
  }

  cancelSale(sale: Sale) {
    const reason = prompt('Motivo de cancelación (obligatorio):');
    if (reason === null) return; // User cancelled prompt
    
    if (reason.trim() === '') {
      this.toast.error('El motivo de cancelación es obligatorio.');
      return;
    }

    if (confirm('¿Estás seguro? Esta acción regresará el stock al inventario.')) {
      this.saleService.cancel(sale.id, reason).subscribe({
        next: () => {
          this.toast.success('Venta cancelada con éxito.');
          this.loadData();
        },
        error: (err) => {
          if (err.status === 400 && err.error?.error) {
            this.toast.error(err.error.error);
          } else {
            this.toast.error('Error al cancelar la venta.');
          }
        }
      });
    }
  }
}
