import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.html',
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  message = 'Verifying…';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.message = 'Missing token.';
      return;
    }

    this.auth
      .verifyEmail(token)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.success = true;
          this.message = res.message || 'Email verified.';
          this.snack.open('Email verified', 'Close', { duration: 2500 });
        },
        error: (err) => {
          this.success = false;
          this.message = err?.error?.message || 'Invalid or expired verification link.';
        },
      });
  }

  goLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
