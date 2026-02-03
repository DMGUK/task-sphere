import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { ProfileService } from '../profile.service';
import { UserProfile } from '../profile.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.scss'],
  standalone: false,
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
    private snack: MatSnackBar
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
        error: () => this.snack.open('Failed to load profile', 'Close', { duration: 3000 }),
      });
  }

  get initials(): string {
    const name = String(this.form.value?.displayName || '').trim();
    if (name.length >= 2) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] ?? '';
      const second = parts.length > 1 ? (parts[1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
      return (first + second).toUpperCase();
    }
    const email = this.profile?.email ?? '';
    return email.slice(0, 2).toUpperCase();
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
          this.snack.open('Avatar updated', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const msg = err?.error?.message || 'Avatar upload failed';
          this.snack.open(msg, 'Close', { duration: 3500 });
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
          this.snack.open('Profile updated', 'Close', { duration: 2500 });
        },
        error: (err) => {
          const msg = err?.error?.message || 'Could not update profile';
          this.snack.open(msg, 'Close', { duration: 3500 });
        },
      });
  }
}
