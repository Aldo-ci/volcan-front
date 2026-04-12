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
import { ToastService } from '../../shared/services/toast.service';
import { SaleDetailComponent } from './sale-detail.component';
import { AuthService } from '../../core/auth/auth.service';

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
    DatePipe
  ],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="sales()" class="w-full">
          
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let element">{{element.occurredAt | date:'short'}}</td>
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

  sales = signal<Sale[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  
  isAdmin = this.authService.isAdmin;
  displayedColumns: string[] = ['date', 'id', 'total', 'status', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.saleService.getAll({ page: this.page(), limit: this.limit() }).subscribe(res => {
      this.sales.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadData();
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
