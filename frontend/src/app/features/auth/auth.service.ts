// src/app/features/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/auth`;

  get token(): string | null {
    return localStorage.getItem('ts_token');
  }
  set token(value: string | null) {
    if (value) localStorage.setItem('ts_token', value);
    else localStorage.removeItem('ts_token');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  login(email: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.base}/login`, { email, password })
      .pipe(tap(res => (this.token = res.token)));
  }

  register(email: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.base}/register`, { email, password })
      .pipe(tap(() => {}));
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.base}/verify-email`, {
      params: { token },
    });
  }

  resendVerification(): Observable<any> {
    return this.http.post(`${this.base}/resend-verification`, {});
  }

  logout() {
    this.token = null;
  }
}
