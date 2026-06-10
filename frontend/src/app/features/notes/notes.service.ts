import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note, NotePayload } from './notes.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBase}/notes`;

  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.baseUrl);
  }

  createNote(data: NotePayload): Observable<Note> {
    return this.http.post<Note>(this.baseUrl, data);
  }

  updateNote(id: number, data: Partial<NotePayload>): Observable<Note> {
    return this.http.patch<Note>(`${this.baseUrl}/${id}`, data);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
