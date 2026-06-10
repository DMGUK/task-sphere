import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth.service';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  email = '';
  submitted = false;
  loading = false;

  constructor(private auth: AuthService, private toast: ToastService) {}

  submit() {
    if (!this.email) return;
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.submitted = true; this.loading = false; },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Something went wrong');
        this.loading = false;
      },
    });
  }
}
