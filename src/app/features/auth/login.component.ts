import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="login-header">
          <h1 class="login-title">Volcan</h1>
          <p class="login-subtitle">Ingresa con tus credenciales</p>
        </div>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            
            @if (errorMsg()) {
              <div class="error-alert" role="alert">
                <span>{{ errorMsg() }}</span>
              </div>
            }

            <mat-form-field appearance="outline">
              <mat-label>Usuario</mat-label>
              <input matInput formControlName="username" type="text" placeholder="Ej. admin" autocomplete="username" />
              <mat-icon matPrefix>person</mat-icon>
              @if (loginForm.controls['username'].hasError('required')) {
                <mat-error>El usuario es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'" autocomplete="current-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="togglePassword($event)" type="button" [attr.aria-label]="'Ocultar contraseña'" [attr.aria-pressed]="hidePassword()">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (loginForm.controls['password'].hasError('required')) {
                <mat-error>La contraseña es requerida</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button class="login-button" type="submit" [disabled]="loginForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-spinner diameter="24" color="accent" class="inline-block"></mat-spinner>
              } @else {
                Iniciar Sesión
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
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
