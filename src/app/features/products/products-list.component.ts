import { Component, OnInit, inject, signal } from '@angular/core';
import { Product, ProductService } from './product.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ProductFormComponent } from './product-form.component';
import { ToastService } from '../../shared/services/toast.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    CurrencyPipe
  ],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Productos</h1>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Nuevo Producto
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="products()" class="w-full">
          
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let element">
              <div class="font-medium">{{element.name}}</div>
              <div class="text-xs text-gray-500">{{element.barcode || 'Sin código'}}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoría</th>
            <td mat-cell *matCellDef="let element">{{element.category?.name}}</td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let element">
              @if (element.regularPrice !== element.salePrice) {
                <div class="line-through text-gray-400 text-xs">{{ element.regularPrice | currency }}</div>
                <div class="font-bold text-green-600">{{ element.salePrice | currency }}</div>
              } @else {
                <div>{{ element.regularPrice | currency }}</div>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef>Stock</th>
            <td mat-cell *matCellDef="let element">
              @if (element.stockQuantity <= element.minimumStock) {
                <span class="text-red-600 font-bold flex items-center gap-1">
                  <mat-icon class="!text-[18px] !h-[18px] !w-[18px]">warning</mat-icon>
                  {{ element.stockQuantity }}
                </span>
              } @else {
                <span>{{ element.stockQuantity }}</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let element">
              @if (element.isActive) {
                <mat-chip class="!bg-green-100 !text-green-800">Activo</mat-chip>
              } @else {
                <mat-chip class="!bg-red-100 !text-red-800">Inactivo</mat-chip>
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
                <button mat-menu-item (click)="openDialog(element)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <button mat-menu-item class="!text-red-600" (click)="deleteProduct(element)">
                  <mat-icon class="!text-red-600">delete</mat-icon>
                  <span>Eliminar</span>
                </button>
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
export class ProductsListComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  products = signal<Product[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  
  displayedColumns: string[] = ['name', 'category', 'price', 'stock', 'status', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.productService.getAll({ page: this.page(), limit: this.limit() }).subscribe(res => {
      this.products.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadData();
  }

  openDialog(product?: Product) {
    const ref = this.dialog.open(ProductFormComponent, {
      data: { product },
      width: '600px'
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  deleteProduct(product: Product) {
    if (confirm(`¿Seguro que deseas eliminar el producto ${product.name}?`)) {
      this.productService.delete(product.id).subscribe({
        next: () => {
          this.toast.success('Producto eliminado');
          this.loadData();
        },
        error: () => this.toast.error('Error al eliminar')
      });
    }
  }
}
