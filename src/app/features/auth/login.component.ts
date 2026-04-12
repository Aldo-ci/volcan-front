import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <mat-card class="w-full max-w-md !rounded-xl !shadow-lg">
        <mat-card-header class="!pb-4 !pt-6 text-center block">
          <mat-card-title class="!text-2xl !font-bold !text-gray-800">VolcanApp POS</mat-card-title>
          <mat-card-subtitle class="!mt-2 !text-gray-500">Ingresa con tus credenciales</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="!px-6">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            
            @if (errorMsg()) {
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">{{ errorMsg() }}</span>
              </div>
            }

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Usuario</mat-label>
              <input matInput formControlName="username" type="text" placeholder="Ej. admin" />
              @if (loginForm.controls['username'].hasError('required')) {
                <mat-error>El usuario es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'" />
              <button mat-icon-button matSuffix (click)="togglePassword($event)" [attr.aria-label]="'Ocultar contraseña'" [attr.aria-pressed]="hidePassword()">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (loginForm.controls['password'].hasError('required')) {
                <mat-error>La contraseña es requerida</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="loginForm.invalid || isLoading()" class="!h-12 !text-base !mt-2">
              @if (isLoading()) {
                <mat-spinner diameter="24" class="inline-block align-middle"></mat-spinner>
              } @else {
                Iniciar Sesión
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  togglePassword(event: MouseEvent) {
    this.hidePassword.update(v => !v);
    event.preventDefault();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMsg.set('Credenciales inválidas.');
        } else {
          this.errorMsg.set('Ocurrió un error. Intenta de nuevo.');
        }
      }
    });
  }
}
