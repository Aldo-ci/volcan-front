import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from './user.service';
import { Role } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="flex items-center justify-between p-4 border-b">
      <h2 class="text-xl font-semibold">{{ isEdit ? 'Editar' : 'Nuevo' }} Usuario</h2>
      <button mat-icon-button (click)="close()" tabindex="-1">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="pt-4">
      <form [formGroup]="form" class="flex flex-col gap-4 min-w-[300px]">
        
        <mat-form-field appearance="outline">
          <mat-label>Usuario</mat-label>
          <input matInput formControlName="username" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contraseña {{ isEdit ? '(Opcional)' : '' }}</mat-label>
          <input matInput formControlName="password" type="password" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="roleId">
            @for (role of roles(); track role.id) {
              <mat-option [value]="role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
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
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserFormComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly isEdit = !!this.data?.user;
  roles = signal<Role[]>([]);

  form = this.fb.group({
    username: [this.data?.user?.username || '', Validators.required],
    password: [''], // Will be required dynamically if not edit
    roleId: [this.data?.user?.roleId || '', Validators.required],
    isActive: [this.data?.user ? !!this.data.user.isActive : true]
  });

  ngOnInit() {
    if (!this.isEdit) {
      this.form.get('password')?.setValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
    
    this.userService.getRoles().subscribe(roles => {
      this.roles.set(roles);
    });
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) return;

    const payload = this.form.getRawValue();
    if (this.isEdit && !payload.password) {
      delete (payload as any).password; // Don't send empty password on edit
    }

    const request = this.isEdit 
      ? this.userService.update(this.data.user.id, payload)
      : this.userService.create(payload);

    request.subscribe({
      next: () => {
        this.toast.success(`Usuario ${this.isEdit ? 'actualizado' : 'creado'}`);
        this.dialogRef.close(true);
      },
      error: () => this.toast.error('Ocurrió un error')
    });
  }
}
