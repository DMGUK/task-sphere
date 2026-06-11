import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UpdateProfilePayload, UserProfile } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly meUrl = `${environment.apiBase}/users/me`;
  private readonly avatarUploadUrl = `${environment.apiBase}/users/me/avatar`;

  constructor(private http: HttpClient) {}

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.meUrl);
  }

  updateMe(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.meUrl, payload);
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const form = new FormData();
    form.append('avatar', file);
    return this.http.post<UserProfile>(this.avatarUploadUrl, form);
  }
}
