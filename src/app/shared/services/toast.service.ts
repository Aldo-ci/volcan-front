import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['bg-green-600', 'text-white'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['bg-red-600', 'text-white'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
