import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthInterceptor: intercepted request', req.url);
  const token = tokenService.getToken();
  const isReceiptPrinterRequest =
    req.url === environment.receiptPrintUrl || req.url === environment.receiptReprintUrl;

  // Clone request to add the auth header
  let authReq = req;
  if (
    token &&
    !isReceiptPrinterRequest &&
    !req.url.includes('/auth/login') &&
    !req.url.includes('/health')
  ) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isReceiptPrinterRequest && !req.url.includes('/auth/login')) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
