import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role.code)) {
      return true;
    }

    return router.parseUrl('/');
  };
};
