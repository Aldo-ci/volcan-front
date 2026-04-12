import { Component, OnInit, inject, signal } from '@angular/core';
import { Category, CategoryService } from './category.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { CategoryFormComponent } from './category-form.component';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule
  ],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Categorías</h1>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          Nueva Categoría
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table mat-table [dataSource]="categories()" class="w-full">
          
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let element">{{element.name}}</td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descripción</th>
            <td mat-cell *matCellDef="let element">{{element.description || 'N/A'}}</td>
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
              <button mat-icon-button color="primary" (click)="openDialog(element)">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <mat-paginator 
          [length]="total()"
          [pageSize]="limit()"
          [pageSizeOptions]="[5, 10, 25, 100]"
          (page)="onPageChange($event)"
          aria-label="Select page">
        </mat-paginator>
      </div>
    </div>
  `
})
export class CategoriesListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.categoryService.getAll({ page: this.page(), limit: this.limit() }).subscribe(res => {
      this.categories.set(res.data);
      this.total.set(res.meta.total);
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadData();
  }

  openDialog(category?: Category) {
    const ref = this.dialog.open(CategoryFormComponent, {
      data: { category },
      width: '400px'
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }
}
