import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from './category.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar' : 'Nueva' }} Categoría</h2>
    <mat-dialog-content class="!pt-4">
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-[300px]">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" color="primary">
          Activo
        </mat-slide-toggle>
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
export class CategoryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  readonly isEdit = !!this.data?.category;

  form = this.fb.nonNullable.group({
    name: [this.data?.category?.name || '', Validators.required],
    description: [this.data?.category?.description || ''],
    isActive: [this.data?.category?.isActive ?? true]
  });

  save() {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();
    const request = this.isEdit 
      ? this.categoryService.update(this.data.category.id, payload)
      : this.categoryService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(`Categoría ${this.isEdit ? 'actualizada' : 'creada'} con éxito`);
        this.dialogRef.close(true);
      },
      error: () => {
        this.toast.error('Ocurrió un error al guardar la categoría');
      }
    });
  }
}
