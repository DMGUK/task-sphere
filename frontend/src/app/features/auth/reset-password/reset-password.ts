import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth.service';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirm = '';
  loading = false;
  done = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.toast.error('Invalid reset link');
      this.router.navigate(['/auth/login']);
    }
  }

  submit() {
    if (this.password !== this.confirm) {
      this.toast.error('Passwords do not match');
      return;
    }
    this.loading = true;
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => { this.done = true; this.loading = false; },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Reset failed');
        this.loading = false;
      },
    });
  }
}
