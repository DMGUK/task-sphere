import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Note } from '../notes.model';
import { NotesService } from '../notes.service';
import { NoteDialogComponent } from '../note-dialog/note-dialog';
import { AiChatComponent } from '../ai-chat/ai-chat.component';
import { ToastService } from '../../../core/toast.service';
import { FormatDatePipe } from '../../../shared/format-date.pipe';

@Component({
  selector: 'app-notes-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, FormatDatePipe, AiChatComponent],
  templateUrl: './notes-page.html',
  styleUrls: ['./notes-page.scss']
})
export class NotesPageComponent implements OnInit {
  private notesService = inject(NotesService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  notes = signal<Note[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.notesService.getNotes().subscribe({
      next: notes => { this.notes.set(notes); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load notes'); }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(NoteDialogComponent, {
      width: '520px',
      data: { mode: 'create' }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.notesService.createNote(result).subscribe({
        next: note => this.notes.update(all => [note, ...all]),
        error: () => this.toast.error('Failed to create note'),
      });
    });
  }

  openEditDialog(note: Note): void {
    const ref = this.dialog.open(NoteDialogComponent, {
      width: '520px',
      data: { mode: 'edit', note }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.notesService.updateNote(note.id, result).subscribe({
        next: updated => this.notes.update(all => all.map(n => n.id === updated.id ? updated : n)),
        error: () => this.toast.error('Failed to update note'),
      });
    });
  }

  deleteNote(note: Note, event: MouseEvent): void {
    event.stopPropagation();
    this.notesService.deleteNote(note.id).subscribe({
      next: () => this.notes.update(all => all.filter(n => n.id !== note.id)),
      error: () => this.toast.error('Failed to delete note'),
    });
  }

}
