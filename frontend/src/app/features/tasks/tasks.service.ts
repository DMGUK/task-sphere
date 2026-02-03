import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './tasks.model';
import { CreateTaskPayload } from './tasks.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  // adjust if you have a different base in environment.ts
  private baseUrl = 'http://localhost:4000/api/tasks';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  createTask(data: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, data);
  }

  updateTask(id: number, patch: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}`, patch);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
