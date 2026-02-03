// src/app/features/tasks/tasks-board/tasks-board.ts
import { Component, OnInit, inject } from '@angular/core';
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

import { Task, TaskStatus } from '../tasks.model';
import { TaskService } from '../tasks.service';

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
export class TasksBoardComponent implements OnInit {
  private taskService = inject(TaskService);
  private snack = inject(MatSnackBar);

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
    this.load();
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
        next: () => this.snack.open('Task updated', 'OK', { duration: 1200 }),
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
