import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth.service';

type VerificationState = 'loading' | 'success' | 'error' | 'already-verified' | 'expired';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './email-verification.html',
  styleUrls: ['./email-verification.scss'],
})
export class EmailVerificationComponent implements OnInit {
  state = signal<VerificationState>('loading');
  errorMessage = signal<string>('');
  countdown = signal<number>(5);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      this.errorMessage.set('Invalid verification link. No token provided.');
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        if (response.alreadyVerified) {
          this.state.set('already-verified');
        } else {
          this.state.set('success');
          this.startCountdown();
        }
      },
      error: (err) => {
        const errorData = err.error;

        if (errorData.expired) {
          this.state.set('expired');
          this.errorMessage.set('Your verification link has expired.');
        } else {
          this.state.set('error');
          this.errorMessage.set(
            errorData.message || 'Verification failed. Please try again.'
          );
        }
      },
    });
  }

  private startCountdown(): void {
    const interval = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        clearInterval(interval);
        this.router.navigate(['/tasks']);
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToTasks(): void {
    this.router.navigate(['/tasks']);
  }
}
