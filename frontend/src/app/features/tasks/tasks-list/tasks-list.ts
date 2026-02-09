// tasks-list.ts
import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TaskService } from '../tasks.service';
import { Task, TaskStatus, TaskPriority } from '../tasks.model';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog';
import { TasksBoardComponent } from '../tasks-board/tasks-board';
import { debounceTime } from 'rxjs/operators';


@Component({
  selector: 'app-tasks-list',
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
    MatDialogModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatTooltipModule,
    TasksBoardComponent
  ],
  templateUrl: './tasks-list.html',
  styleUrls: ['./tasks-list.scss'],
})
export class TasksListComponent implements OnInit {
  private taskService = inject(TaskService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // raw tasks from API
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  error: string | null = null;

  statusFilter = signal<'all' | TaskStatus>('all');
  priorityFilter = signal<'all' | TaskPriority>('all');
  sortBy = signal<'dueDate' | 'createdAt' | 'priority'>('dueDate');
  sortDir = signal<'asc' | 'desc'>('asc');

  searchControl = new FormControl<string>('', { nonNullable: true });
  searchTerm = signal<string>('');

  readonly viewMode = signal<'list' | 'board'>('list');

  toggleView() {
    this.viewMode.update((m) => (m === 'list' ? 'board' : 'list'));
  }

  get isBoardView(): boolean {
    return this.viewMode() === 'board';
  }

  // derived list
  readonly filteredTasks = computed(() => {
    let list = [...this.tasks()];

    const search = this.searchTerm();
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const sort = this.sortBy();
    const dir = this.sortDir();

    if (search) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(search) ||
        (t.description ?? '').toLowerCase().includes(search)
      );
    }

    if (status !== 'all') {
      list = list.filter((t) => t.status === status);
    }

    if (priority !== 'all') {
      list = list.filter((t) => t.priority === priority);
    }

    list.sort((a, b) => {
      let av: any;
      let bv: any;

      if (sort === 'priority') {
        av = a.priority;
        bv = b.priority;
      } else {
        av = a[sort] ? new Date(a[sort] as string).getTime() : 0;
        bv = b[sort] ? new Date(b[sort] as string).getTime() : 0;
      }

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  });

  onPriorityChange(raw: string) {
    if (raw === 'all') {
      this.priorityFilter.set('all');
    } else {
      this.priorityFilter.set(Number(raw) as TaskPriority);
    }
  }

  ngOnInit(): void {
    this.load();

    // keep searchTerm in sync with the input, with a tiny debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(150))
      .subscribe((value) => this.searchTerm.set(value.trim().toLowerCase()));
  }

  load() {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      },
    });
  }

  toggleComplete(task: Task) {
    const old = { ...task };

    const nowCompleted = !task.completed;
    const newStatus: TaskStatus = nowCompleted ? 'done' : task.originalStatus;

    const updated: Task = { ...task, completed: nowCompleted, status: newStatus };

    // optimistic update in signal
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? updated : t))
    );

    this.taskService
      .updateTask(task.id, { completed: nowCompleted, status: newStatus })
      .subscribe({
        next: () =>
          this.snack.open('Task updated', 'OK', { duration: 1200 }),
        error: (err) => {
          console.error(err);
          // rollback on error
          this.tasks.update((list) =>
            list.map((t) => (t.id === old.id ? old : t))
          );
          this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
        },
      });
  }

  startTask(task: Task) {
    const old = { ...task };

    const updated: Task = {
      ...task,
      status: 'in_progress',
      originalStatus: 'in_progress'
    };

    // optimistic update in signal
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? updated : t))
    );

    this.taskService
      .updateTask(task.id, {
        status: 'in_progress',
        originalStatus: 'in_progress'
      })
      .subscribe({
        next: () =>
          this.snack.open('Task started', 'OK', { duration: 1200 }),
        error: (err) => {
          console.error(err);
          // rollback on error
          this.tasks.update((list) =>
            list.map((t) => (t.id === old.id ? old : t))
          );
          this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
        },
      });
  }

  stopTask(task: Task) {
    const old = { ...task };

    const updated: Task = {
      ...task,
      status: 'todo',
      originalStatus: 'todo'
    };

    // optimistic update in signal
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? updated : t))
    );

    this.taskService
      .updateTask(task.id, {
        status: 'todo',
        originalStatus: 'todo'
      })
      .subscribe({
        next: () =>
          this.snack.open('Task stopped', 'OK', { duration: 1200 }),
        error: (err) => {
          console.error(err);
          // rollback on error
          this.tasks.update((list) =>
            list.map((t) => (t.id === old.id ? old : t))
          );
          this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
        },
      });
  }

  openTaskDialog() {
    this.edit(); // no task => create
  }

  edit(task?: Task) {
    const dialogRef = this.dialog.open(TaskEditDialogComponent, {
      width: '480px',
      data: task
        ? { mode: 'edit' as const, task }
        : {
            mode: 'create' as const,
            task: {
              title: '',
              description: '',
              dueDate: null,
              priority: 1,
              // No status field - will be set to 'todo' when creating
            },
          },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      if (task) {
        // EDIT MODE: Update existing task
        // Status is NOT changed here - preserve existing status
        this.taskService
          .updateTask(task.id, {
            title: result.title,
            description: result.description,
            dueDate: result.dueDate,
            priority: result.priority,
            // status is intentionally NOT included - keeps existing status
          })
          .subscribe((updated) => {
            this.tasks.update((list) =>
              list.map((t) => (t.id === updated.id ? updated : t))
            );
            this.snack.open('Task updated', 'OK', { duration: 1200 });
          });
      } else {
        // CREATE MODE: New task always starts as 'todo'
        this.taskService
          .createTask({
            title: result.title,
            description: result.description,
            dueDate: result.dueDate,
            priority: result.priority,
            status: 'todo', // ⭐ Always 'todo' for new tasks
            originalStatus: 'todo', // ⭐ Track original status
            completed: false, // ⭐ Never completed when created
          })
          .subscribe((created) => {
            this.tasks.update((list) => [...list, created]);
            this.snack.open('Task created', 'OK', { duration: 1200 });
          });
      }
    });
  }

  remove(task: Task) {
    const backup = this.tasks();

    this.tasks.update((list) => list.filter((t) => t.id !== task.id)); // optimistic

    this.taskService.deleteTask(task.id).subscribe({
      next: () =>
        this.snack.open('Removed', 'OK', { duration: 1200 }),
      error: (err) => {
        console.error(err);
        this.tasks.set(backup); // rollback
        this.snack.open('Delete failed', 'Dismiss', { duration: 2000 });
      },
    });
  }

  dueState(task: Task): 'overdue' | 'soon' | 'future' | null {
    if (!task.dueDate) return null;

    const due = new Date(task.dueDate);
    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (due < today) return 'overdue';

    const diffDays =
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) return 'soon';
    return 'future';
  }

  // use filtered list, not raw tasks
  get activeCount(): number {
    return this.filteredTasks().filter((t) => !t.completed).length;
  }

  get completedCount(): number {
    return this.filteredTasks().filter((t) => t.completed).length;
  }

  // Event handlers for board component
  onTaskUpdated(updatedTask: Task): void {
    this.tasks.update((list) =>
      list.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  }

  onTaskDeleted(taskId: number): void {
    this.tasks.update((list) => list.filter((t) => t.id !== taskId));
  }
}
