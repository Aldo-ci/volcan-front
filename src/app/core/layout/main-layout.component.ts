import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <mat-sidenav-container class="h-screen bg-gray-50">
      <mat-sidenav #sidenav mode="side" opened class="w-64 !bg-white !border-r !border-gray-200">
        <div class="h-16 flex items-center justify-center border-b border-gray-200">
          <span class="text-xl font-bold text-indigo-600">VolcanApp POS</span>
        </div>
        
        <mat-nav-list class="!pt-4">
          <a mat-list-item routerLink="/dashboard" routerLinkActive="!bg-indigo-50 !text-indigo-600">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>

          @if (isAdmin()) {
            <a mat-list-item routerLink="/users" routerLinkActive="!bg-indigo-50 !text-indigo-600">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Usuarios</span>
            </a>
          }

          <a mat-list-item routerLink="/categories" routerLinkActive="!bg-indigo-50 !text-indigo-600">
            <mat-icon matListItemIcon>category</mat-icon>
            <span matListItemTitle>Categorías</span>
          </a>

          <a mat-list-item routerLink="/products" routerLinkActive="!bg-indigo-50 !text-indigo-600">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>Productos</span>
          </a>

          <a mat-list-item routerLink="/pos" routerLinkActive="!bg-indigo-50 !text-indigo-600">
            <mat-icon matListItemIcon>point_of_sale</mat-icon>
            <span matListItemTitle>Nueva Venta</span>
          </a>

          <a mat-list-item routerLink="/sales" routerLinkActive="!bg-indigo-50 !text-indigo-600">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Historial de Ventas</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="flex flex-col h-full overflow-hidden">
        <mat-toolbar color="primary" class="!bg-white !text-gray-800 !border-b !border-gray-200 !shadow-none z-10">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="flex-1"></span>
          <span class="text-sm font-medium mr-4">{{ currentUser()?.username }} ({{ currentUser()?.role?.name }})</span>
          <button mat-icon-button (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        
        <main class="flex-1 overflow-auto p-6 bg-gray-50">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser = this.authService.currentUser;
  isAdmin = this.authService.isAdmin;

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
