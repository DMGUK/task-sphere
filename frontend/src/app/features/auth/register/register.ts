import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {

  email = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  // register.component.ts
  submit() {
    this.auth.register(this.email, this.password).subscribe({
      next: () => {
        // Do NOT auto-login → redirect to login page
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' } // optional flag
        });
      },
      error: () => alert('Could not register'),
    });
  }


}
