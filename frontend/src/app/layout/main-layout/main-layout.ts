import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';
import { NgClass, NgIf, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileService } from '../../features/profile/profile.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NgIf, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss']
})
export class MainLayout {

  emailVerified = true;
  resendLoading = false;
  devVerifyUrl: string | null = null;

  constructor(
    private profileService: ProfileService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.profileService.getMe().subscribe({
      next: (me) => {
        this.emailVerified = !!me.emailVerifiedAt;
      },
      error: () => {
        // ignore or handle
      }
    });
  }

  resendVerification() {
    this.resendLoading = true;
    this.auth.resendVerification().pipe(finalize(() => this.resendLoading = false)).subscribe({
      next: (res) => {
        this.snack.open('Verification link sent', 'Close', { duration: 2500 });
        // dev convenience
        this.devVerifyUrl = res.verifyUrl ?? null;
      },
      error: (err) => {
        const msg = err?.error?.message || 'Could not resend verification';
        this.snack.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
