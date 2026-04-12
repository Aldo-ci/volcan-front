import { Routes } from '@angular/router';
import { authGuard, loggedInGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories-list.component').then(m => m.CategoriesListComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list.component').then(m => m.ProductsListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-list.component').then(m => m.UsersListComponent),
        canActivate: [roleGuard(['admin'])]
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/sales/sales-list.component').then(m => m.SalesListComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
