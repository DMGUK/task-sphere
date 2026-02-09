// src/app/features/tasks/tasks-board/tasks-board.ts
import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { Task, TaskStatus } from '../tasks.model';
import { TaskService } from '../tasks.service';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog';

type BoardColumns = Record<TaskStatus, Task[]>;

@Component({
  selector: 'app-tasks-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './tasks-board.html',
  styleUrls: ['./tasks-board.scss'],
})
export class TasksBoardComponent implements OnInit, OnChanges {
  private taskService = inject(TaskService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Input from parent to receive filtered tasks
  @Input() tasks: Task[] = [];

  // Output events to notify parent of changes
  taskUpdated = output<Task>();
  taskDeleted = output<number>();

  // Kanban columns
  columns: BoardColumns = {
    todo: [],
    in_progress: [],
    done: [],
  };

  columnDefs: { key: TaskStatus; label: string }[] = [
    { key: 'todo',        label: 'To do' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'done',        label: 'Done' },
  ];

  ngOnInit(): void {
    if (this.tasks.length === 0) {
      this.load();
    } else {
      this.groupTasks(this.tasks);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] && !changes['tasks'].firstChange) {
      this.groupTasks(this.tasks);
    }
  }

  load(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => this.groupTasks(tasks),
      error: (err) => {
        console.error(err);
        this.snack.open('Failed to load tasks', 'Dismiss', { duration: 2000 });
      },
    });
  }

  private groupTasks(tasks: Task[]): void {
    // reset
    this.columns = {
      todo: [],
      in_progress: [],
      done: [],
    };

    for (const t of tasks) {
      this.columns[t.status].push(t);
    }
  }

  // Helper method for connected drop lists
  getOtherColumnIds(currentKey: TaskStatus): string[] {
    return this.columnDefs
      .filter(col => col.key !== currentKey)
      .map(col => col.key);
  }

  // Track by function for better performance
  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  // Due state calculation
  dueState(task: Task): 'overdue' | 'soon' | 'future' | null {
    if (!task.dueDate) return null;

    const due = new Date(task.dueDate);
    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (due < today) return 'overdue';

    const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) return 'soon';
    return 'future';
  }

  // Start task: To do → In progress
  startTask(task: Task): void {
    const old = { ...task };

    task.status = 'in_progress';
    task.originalStatus = 'in_progress';

    this.taskService
      .updateTask(task.id, {
        status: 'in_progress',
        originalStatus: 'in_progress',
      })
      .subscribe({
        next: (updated) => {
          this.snack.open('Task started', 'OK', { duration: 1200 });
          this.taskUpdated.emit(updated);
          // Re-group to move card to new column
          this.groupTasks(this.tasks.map(t => t.id === updated.id ? updated : t));
        },
        error: (err) => {
          console.error(err);
          Object.assign(task, old);
          this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
        },
      });
  }

  // Stop task: In progress → To do
  stopTask(task: Task): void {
    const old = { ...task };

    task.status = 'todo';
    task.originalStatus = 'todo';

    this.taskService
      .updateTask(task.id, {
        status: 'todo',
        originalStatus: 'todo',
      })
      .subscribe({
        next: (updated) => {
          this.snack.open('Task stopped', 'OK', { duration: 1200 });
          this.taskUpdated.emit(updated);
          // Re-group to move card to new column
          this.groupTasks(this.tasks.map(t => t.id === updated.id ? updated : t));
        },
        error: (err) => {
          console.error(err);
          Object.assign(task, old);
          this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
        },
      });
  }

  // Edit task
  editTask(task: Task): void {
    const dialogRef = this.dialog.open(TaskEditDialogComponent, {
      width: '480px',
      data: { mode: 'edit' as const, task },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.taskService
        .updateTask(task.id, {
          title: result.title,
          description: result.description,
          dueDate: result.dueDate,
          priority: result.priority,
        })
        .subscribe({
          next: (updated) => {
            Object.assign(task, updated);
            this.snack.open('Task updated', 'OK', { duration: 1200 });
            this.taskUpdated.emit(updated);
          },
          error: (err) => {
            console.error(err);
            this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
          },
        });
    });
  }

  // Remove task
  removeTask(task: Task): void {
    if (!confirm(`Remove task "${task.title}"?`)) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.snack.open('Task removed', 'OK', { duration: 1200 });
        this.taskDeleted.emit(task.id);
        // Remove from columns
        this.columns[task.status] = this.columns[task.status].filter(t => t.id !== task.id);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Delete failed', 'Dismiss', { duration: 2000 });
      },
    });
  }

  // Drag and drop handler
  drop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatus): void {
    // same list → just re-order
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      return;
    }

    // move between columns
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const movedTask = event.container.data[event.currentIndex];
    const backup: Task = { ...movedTask };

    movedTask.status = targetStatus;
    movedTask.completed = targetStatus === 'done';

    this.taskService
      .updateTask(movedTask.id, {
        status: targetStatus,
        completed: movedTask.completed,
      })
      .subscribe({
        next: (updated) => {
          this.snack.open('Task updated', 'OK', { duration: 1200 });
          this.taskUpdated.emit(updated);
        },
        error: (err) => {
          console.error(err);
          // rollback
          Object.assign(movedTask, backup);
          this.snack.open('Update failed', 'Dismiss', { duration: 2000 });
          // reload to be extra safe
          this.load();
        },
      });
  }
}
