import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  isLoading = signal(false);

  show(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    this.count++;
    this.isLoading.set(true);
  }

  hide(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) {
      this.hideTimer = setTimeout(() => this.isLoading.set(false), 300);
    }
  }
}
