import { ChangeDetectionStrategy, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import {
  MatDatepickerModule
} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Task, TaskPriority, TaskStatus } from '../tasks.model';

interface TaskDialogData {
  mode: 'create' | 'edit';
  task: Partial<Task>;
}

@Component({
  selector: 'app-task-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './task-edit-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TaskEditDialogComponent {
  private fb = inject(FormBuilder);
  form: FormGroup;

  minDate: Date = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return d;
  })();

  constructor(
    private dialogRef: MatDialogRef<TaskEditDialogComponent, Partial<Task> | null>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {
    const t = data.task || {};

    this.form = this.fb.group({
      title: [t.title ?? '', [Validators.required, Validators.minLength(2)]],
      description: [t.description ?? ''],
      dueDate: [t.dueDate ? new Date(t.dueDate) : null],
      priority: [t.priority ?? 1, [Validators.required]],
      status: [t.status ?? ('todo' as TaskStatus), [Validators.required]],
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.form.invalid) return;

    const raw = this.form.value;

    const patch: Partial<Task> = {
      title: raw.title,
      description: raw.description || null,
      dueDate: raw.dueDate ? (raw.dueDate as Date).toISOString() : null,
      priority: raw.priority as TaskPriority,
      status: raw.status as TaskStatus,
    };

    this.dialogRef.close(patch);
  }
}
