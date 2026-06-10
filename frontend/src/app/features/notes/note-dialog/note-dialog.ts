import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Note, NotePayload } from '../notes.model';

export interface NoteDialogData {
  mode: 'create' | 'edit';
  note?: Partial<Note>;
}

export const NOTE_COLORS = [
  { value: '#ffffff', label: 'White' },
  { value: '#fef9c3', label: 'Yellow' },
  { value: '#dbeafe', label: 'Blue' },
  { value: '#dcfce7', label: 'Green' },
  { value: '#fce7f3', label: 'Pink' },
  { value: '#ede9fe', label: 'Purple' },
];

@Component({
  selector: 'app-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './note-dialog.html',
  styleUrls: ['./note-dialog.scss'],
})
export class NoteDialogComponent {
  private fb = inject(FormBuilder);
  readonly colors = NOTE_COLORS;
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<NoteDialogComponent, NotePayload | null>,
    @Inject(MAT_DIALOG_DATA) public data: NoteDialogData
  ) {
    const n = data.note ?? {};
    this.form = this.fb.group({
      title:   [n.title   ?? '', [Validators.required, Validators.minLength(1)]],
      content: [n.content ?? ''],
      color:   [n.color   ?? '#ffffff'],
    });
  }

  selectColor(value: string): void {
    this.form.patchValue({ color: value });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (this.form.invalid) return;
    const { title, content, color } = this.form.value;
    this.dialogRef.close({ title: title.trim(), content: content || null, color });
  }
}
