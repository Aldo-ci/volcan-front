import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from './product.service';
import { CategoryService, Category } from '../categories/category.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nuevo' }} Producto</h2>
    <mat-dialog-content class="!pt-4">
      <form [formGroup]="form" class="grid grid-cols-2 gap-4">
        
        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Código de Barras</mat-label>
          <input matInput formControlName="barcode" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <mat-select formControlName="categoryId">
            @for (cat of categories(); track cat.id) {
              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Precio Regular</mat-label>
          <input matInput formControlName="regularPrice" type="number" min="0" step="0.01" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Precio Oferta (Opcional)</mat-label>
          <input matInput formControlName="salePrice" type="number" min="0" step="0.01" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stock Actual</mat-label>
          <input matInput formControlName="stockQuantity" type="number" min="0" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stock Mínimo</mat-label>
          <input matInput formControlName="minimumStock" type="number" min="0" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>URL de la Imagen (Opcional)</mat-label>
          <input matInput formControlName="imageUrl" type="url" placeholder="https://ejemplo.com/imagen.jpg" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-span-2">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="col-span-2">
          <mat-slide-toggle formControlName="isActive" color="primary">
            Activo
          </mat-slide-toggle>
        </div>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        Guardar
      </button>
    </mat-dialog-actions>
  `
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductFormComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  readonly isEdit = !!this.data?.product;
  categories = signal<Category[]>([]);

  form = this.fb.group({
    name: [this.data?.product?.name || '', Validators.required],
    barcode: [this.data?.product?.barcode || ''],
    categoryId: [
      this.data?.product?.categoryId?.id || this.data?.product?.categoryId || this.data?.product?.category?.id || '',
      Validators.required
    ],
    regularPrice: [this.data?.product?.regularPrice || '', [Validators.required, Validators.min(0)]],
    salePrice: [this.data?.product?.salePrice || '', [Validators.min(0)]],
    stockQuantity: [this.data?.product?.stockQuantity || 0, [Validators.required, Validators.min(0)]],
    minimumStock: [this.data?.product?.minimumStock || 0, [Validators.required, Validators.min(0)]],
    imageUrl: [this.data?.product?.imageUrl || ''],
    description: [this.data?.product?.description || ''],
    isActive: [this.data.product ? !!this.data?.product?.isActive : true]
  });

  ngOnInit() {
    // We only fetch active categories ideally, but we fetch all for simplicity
    this.categoryService.getAll({ limit: 100, isActive: true }).subscribe(res => {
      this.categories.set(res.data);
    });
  }

  save() {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();
    // Format numbers
    payload.regularPrice = Number(payload.regularPrice);
    if (payload.salePrice !== '') {
      payload.salePrice = Number(payload.salePrice);
    } else {
      delete payload.salePrice; // Let backend handle default
    }

    const request = this.isEdit 
      ? this.productService.update(this.data.product.id, payload)
      : this.productService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(`Producto ${this.isEdit ? 'actualizado' : 'creado'}`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        if (err.status === 400 && err.error?.error) {
          this.toast.error(err.error.error); // Show backend validation (e.g., salePrice > regularPrice)
        } else {
          this.toast.error('Ocurrió un error');
        }
      }
    });
  }
}
