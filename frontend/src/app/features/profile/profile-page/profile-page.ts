import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { ProfileService } from '../profile.service';
import { UserProfile } from '../profile.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/toast.service';
import { getInitials } from '../../../shared/initials.util';


@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
})
export class ProfilePage implements OnInit, OnDestroy {
  loading = true;
  saving = false;
  uploading = false;

  profile: UserProfile | null = null;

  private objectUrl: string | null = null;
  avatarPreviewUrl: string | null = null;

  // ✅ always defined, even before constructor runs
  form = new FormGroup({
    displayName: new FormControl('', [Validators.minLength(2), Validators.maxLength(40)]),
  });

  constructor(
    private profileService: ProfileService,
    private snack: MatSnackBar,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  private revokePreviewUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.avatarPreviewUrl = null;
  }

  load(): void {
    this.loading = true;
    this.revokePreviewUrl();

    this.profileService
      .getMe()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (p) => {
          this.profile = p;
          this.form.reset({ displayName: p.displayName ?? '' }, { emitEvent: false });
          this.form.markAsPristine();
        },
        error: () => this.toast.error('Failed to load profile'),
      });
  }

  get initials(): string {
    return getInitials(this.form.value?.displayName, this.profile?.email);
  }

  get avatarSrc(): string | null {
    if (this.avatarPreviewUrl) return this.avatarPreviewUrl;

    const url = this.profile?.avatarUrl ?? null;
    if (!url) return null;

    if (url.startsWith('/uploads/')) {
      const base = environment.apiBase.replace(/\/api\/?$/, '');
      return `${base}${url}`;
    }
    return url;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.snack.open('Only JPG/PNG/WEBP allowed', 'Close', { duration: 3000 });
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.snack.open('Max file size is 2MB', 'Close', { duration: 3000 });
      input.value = '';
      return;
    }

    this.revokePreviewUrl();
    this.objectUrl = URL.createObjectURL(file);
    this.avatarPreviewUrl = this.objectUrl;

    this.uploading = true;
    this.profileService
      .uploadAvatar(file)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.toast.success('Avatar updated!');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Avatar upload failed';
          this.toast.error(msg);
        },
      });
  }

  save(): void {
    if (this.form.invalid || this.saving || !this.form.dirty) return;

    const displayName = String(this.form.value?.displayName || '').trim();

    this.saving = true;
    this.profileService
      .updateMe({ displayName: displayName.length ? displayName : null })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.form.markAsPristine();
          this.toast.success('Profile updated!');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Could not update profile';
          this.toast.error(msg);
        },
      });
  }

  resendingEmail = false;

  resendVerification(): void {
    this.resendingEmail = true;

    this.authService.resendVerification().subscribe({
      next: () => {
        this.resendingEmail = false;
        this.toast.success('Verification email sent! Check your inbox.');
      },
      error: (err) => {
        this.resendingEmail = false;
        this.toast.error(err.error?.message || 'Failed to send email');
      },
    });
  }
}
