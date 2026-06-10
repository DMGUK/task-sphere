import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'end',    // ← Right side
    verticalPosition: 'bottom',   // ← Bottom (more common)
  };

  /**
   * Show success toast (green)
   */
  success(message: string, duration = 3000): void {
    this.snackBar.open(message, '✓', {
      ...this.defaultConfig,
      duration,
      panelClass: ['toast-success'],
    });
  }

  /**
   * Show error toast (red)
   */
  error(message: string, duration = 4000): void {
    this.snackBar.open(message, '✕', {
      ...this.defaultConfig,
      duration,
      panelClass: ['toast-error'],
    });
  }

  /**
   * Show info toast (blue)
   */
  info(message: string, duration = 3000): void {
    this.snackBar.open(message, 'ℹ', {
      ...this.defaultConfig,
      duration,
      panelClass: ['toast-info'],
    });
  }

  /**
   * Show warning toast (amber)
   */
  warning(message: string, duration = 3500): void {
    this.snackBar.open(message, '⚠', {
      ...this.defaultConfig,
      duration,
      panelClass: ['toast-warning'],
    });
  }

  /**
   * Show custom toast
   */
  show(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      ...config,
    });
  }
}
