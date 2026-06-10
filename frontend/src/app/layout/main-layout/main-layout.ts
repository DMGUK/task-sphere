import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';
import { ProfileService } from '../../features/profile/profile.service';
import { UserProfile } from '../../features/profile/profile.model';
import { environment } from '../../../environments/environment';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../core/loading.service';
import { ToastService } from '../../core/toast.service';
import { getInitials } from '../../shared/initials.util';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayout implements OnInit {
  // User data
  user: UserProfile | null = null;
  emailVerified = false;
  resendLoading = false;
  devVerifyUrl: string | null = null;

  constructor(
    private profileService: ProfileService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router,
    public loadingService: LoadingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadUser();
    }

  }

  private loadUser(): void {
    this.profileService.getMe().subscribe({
      next: (user) => {
        this.user = user;
        this.emailVerified = !!user.emailVerifiedAt;
      },
      error: (err) => {
        console.error('Failed to load user:', err);
      }
    });
  }

  // User display properties
  get userDisplayName(): string {
    return this.user?.displayName || this.user?.email?.split('@')[0] || 'User';
  }

  get userEmail(): string {
    return this.user?.email || '';
  }

  get userInitials(): string {
    return getInitials(this.user?.displayName, this.user?.email);
  }

  get userAvatarUrl(): string | null {
    const url = this.user?.avatarUrl;
    if (!url) return null;

    // If relative path, prepend API base
    if (url.startsWith('/uploads/')) {
      const base = environment.apiBase.replace(/\/api\/?$/, '');
      return `${base}${url}`;
    }

    return url;
  }

  // Auth methods
  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout(): void {
    this.auth.logout();
    this.user = null;
    this.router.navigate(['/auth/login']);
  }

  resendVerification(): void {
    this.resendLoading = true;
    this.auth.resendVerification()
      .pipe(finalize(() => this.resendLoading = false))
      .subscribe({
        next: (res) => {
          this.toast.success('Verification email sent!');
          this.devVerifyUrl = res.verifyUrl ?? null;
        },
        error: (err) => {
          const msg = err?.error?.message || 'Could not resend verification';
          this.toast.error(msg);
        }
      });
  }
}
