import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SaleService, SalesSummary } from '../sales/sale.service';
import { ProductService, Product } from '../products/product.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      @if (summary()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <mat-card class="!shadow-sm border border-gray-200">
            <mat-card-content class="!p-4">
              <div class="text-gray-500 text-sm font-medium">Ventas Totales</div>
              <div class="text-2xl font-bold text-indigo-600">{{ summary()?.totalSold | currency }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="!shadow-sm border border-gray-200">
            <mat-card-content class="!p-4">
              <div class="text-gray-500 text-sm font-medium">Descuentos Aplicados</div>
              <div class="text-2xl font-bold text-red-500">{{ summary()?.discountTotal | currency }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="!shadow-sm border border-gray-200">
            <mat-card-content class="!p-4">
              <div class="text-gray-500 text-sm font-medium">Tickets de Venta</div>
              <div class="text-2xl font-bold text-gray-800">{{ summary()?.tickets }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="!shadow-sm border border-gray-200">
            <mat-card-content class="!p-4">
              <div class="text-gray-500 text-sm font-medium">Unidades Vendidas</div>
              <div class="text-2xl font-bold text-gray-800">{{ summary()?.totalUnits }}</div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <div class="mt-8">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <mat-icon class="text-red-500">warning</mat-icon> Alertas de Stock Bajo
        </h2>
        
        <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table mat-table [dataSource]="lowStockProducts()" class="w-full">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let element">{{element.name}}</td>
            </ng-container>

            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Stock Actual</th>
              <td mat-cell *matCellDef="let element" class="text-red-600 font-bold">
                {{element.stockQuantity}} (Min: {{element.minimumStock}})
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['name', 'stock']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['name', 'stock'];"></tr>
          </table>
          
          @if (lowStockProducts().length === 0) {
            <div class="p-6 text-center text-gray-500">No hay alertas de stock bajo.</div>
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly saleService = inject(SaleService);
  private readonly productService = inject(ProductService);

  summary = signal<SalesSummary | null>(null);
  lowStockProducts = signal<Product[]>([]);

  ngOnInit() {
    this.saleService.getSummary().subscribe(res => {
      this.summary.set(res);
    });

    this.productService.getLowStock().subscribe(res => {
      this.lowStockProducts.set(res);
    });
  }
}

