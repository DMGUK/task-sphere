import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly KEY = 'ts_token';

  get(): string | null {
    return localStorage.getItem(this.KEY);
  }

  set(value: string): void {
    localStorage.setItem(this.KEY, value);
  }

  remove(): void {
    localStorage.removeItem(this.KEY);
  }
}
