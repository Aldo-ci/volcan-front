import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Sale } from './sale.service';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatTableModule, CurrencyPipe, DatePipe],
  template: `
    <h2 mat-dialog-title>Detalle de Venta</h2>
    <mat-dialog-content class="!pt-4 min-w-[500px]">
      
      <div class="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500 block">ID Ticket</span>
          <span class="font-medium">{{ sale.id }}</span>
        </div>
        <div>
          <span class="text-gray-500 block">Fecha</span>
          <span class="font-medium">{{ sale.occurredAt | date:'dd/MM/yyyy, hh:mm a' }}</span>
        </div>
        <div>
          <span class="text-gray-500 block">Estado</span>
          <span class="font-medium" [class.text-red-600]="sale.status === 'cancelled'" [class.text-green-600]="sale.status === 'completed'">
            {{ sale.status === 'cancelled' ? 'Cancelada' : 'Completada' }}
          </span>
        </div>
        @if(sale.notes) {
          <div class="col-span-2">
            <span class="text-gray-500 block">Notas</span>
            <span class="font-medium">{{ sale.notes }}</span>
          </div>
        }
      </div>

      <table mat-table [dataSource]="sale.items" class="w-full mb-4 border border-gray-200">
        
        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let item">
            {{ item.productNameSnapshot }}
            <div class="text-xs text-gray-500">{{ item.productBarcodeSnapshot }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="qty">
          <th mat-header-cell *matHeaderCellDef>Cant.</th>
          <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Precio Unit.</th>
          <td mat-cell *matCellDef="let item">{{ item.unitPrice | currency }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let item" class="font-bold">{{ item.lineTotal | currency }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="['product', 'qty', 'price', 'total']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['product', 'qty', 'price', 'total'];"></tr>
      </table>

      <div class="flex flex-col items-end gap-1 text-right">
        <div class="w-48 flex justify-between">
          <span class="text-gray-500">Subtotal:</span>
          <span>{{ sale.subtotal | currency }}</span>
        </div>
        <div class="w-48 flex justify-between">
          <span class="text-gray-500">Descuento:</span>
          <span class="text-red-600">-{{ sale.discountTotal | currency }}</span>
        </div>
        <div class="w-48 flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span>{{ sale.total | currency }}</span>
        </div>
      </div>

      @if(sale.status === 'cancelled') {
        <div class="mt-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <div class="font-bold">Información de Cancelación:</div>
          <div>Fecha: {{ sale.cancelledAt | date:'dd/MM/yyyy, hh:mm a' }}</div>
          <div>Motivo: {{ sale.cancellationReason }}</div>
        </div>
      }

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `
})
export class SaleDetailComponent {
  readonly data = inject<any>(MAT_DIALOG_DATA);
  sale: Sale = this.data.sale;
}
