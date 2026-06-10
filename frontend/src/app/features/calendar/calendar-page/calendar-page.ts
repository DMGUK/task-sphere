import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Task } from '../../tasks/tasks.model';
import { TaskService } from '../../tasks/tasks.service';
import { TaskEditDialogComponent } from '../../tasks/task-edit-dialog/task-edit-dialog';
import { ToastService } from '../../../core/toast.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './calendar-page.html',
  styleUrls: ['./calendar-page.scss']
})
export class CalendarPageComponent implements OnInit {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  currentDate = signal(new Date());
  tasks = signal<Task[]>([]);

  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthLabel = computed(() =>
    this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const days: CalendarDay[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const day = new Date(cursor);
      days.push({
        date: day,
        isCurrentMonth: day.getMonth() === month,
        isToday: day.getTime() === today.getTime(),
        tasks: this.tasks().filter(t => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due.getFullYear() === day.getFullYear() &&
                 due.getMonth() === day.getMonth() &&
                 due.getDate() === day.getDate();
        })
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  });

  weeks = computed(() => {
    const days = this.calendarDays();
    const result: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  });

  ngOnInit(): void {
    this.taskService.getTasks().subscribe({
      next: tasks => this.tasks.set(tasks),
      error: () => this.toast.error('Failed to load tasks'),
    });
  }

  prevMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  openCreateDialog(day: CalendarDay): void {
    const ref = this.dialog.open(TaskEditDialogComponent, {
      width: '480px',
      data: {
        mode: 'create',
        task: { dueDate: day.date.toISOString() },
        minDate: null
      }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.taskService.createTask({ ...result, status: 'todo', completed: false }).subscribe({
        next: task => this.tasks.update(all => [...all, task]),
        error: () => this.toast.error('Failed to create task'),
      });
    });
  }

  openEditDialog(task: Task, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(TaskEditDialogComponent, {
      width: '480px',
      data: { mode: 'edit', task, minDate: null }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.taskService.updateTask(task.id, result).subscribe({
        next: updated => this.tasks.update(all => all.map(t => t.id === updated.id ? updated : t)),
        error: () => this.toast.error('Failed to update task'),
      });
    });
  }

  deleteTask(task: Task, event: MouseEvent): void {
    event.stopPropagation();
    this.taskService.deleteTask(task.id).subscribe({
      next: () => this.tasks.update(all => all.filter(t => t.id !== task.id)),
      error: () => this.toast.error('Failed to delete task'),
    });
  }

  taskChipClass(task: Task): string {
    if (task.completed || task.status === 'done') return 'chip-done';
    if (task.status === 'in_progress') return 'chip-in-progress';
    if (task.priority === 0) return 'chip-high';
    return 'chip-todo';
  }
}
