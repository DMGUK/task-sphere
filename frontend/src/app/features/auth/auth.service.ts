import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../../core/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private base = `${environment.apiBase}/auth`;

  get token(): string | null {
    return this.tokenStorage.get();
  }
  set token(value: string | null) {
    if (value) this.tokenStorage.set(value);
    else this.tokenStorage.remove();
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  login(email: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.base}/login`, { email, password })
      .pipe(tap(res => (this.token = res.token)));
  }

  register(email: string, password: string, displayName?: string) {
    return this.http
      .post<{ token: string }>(`${this.base}/register`, { email, password, displayName: displayName?.trim() || undefined })
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

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, { token, password });
  }

  logout() {
    this.token = null;
  }
}
