import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NotesPageComponent } from './notes-page';
import { NotesService } from '../notes.service';
import { ToastService } from '../../../core/toast.service';
import { Note } from '../notes.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const mockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: 'Test note',
  content: 'Content',
  color: '#ffffff',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('NotesPageComponent', () => {
  let component: NotesPageComponent;
  let fixture: ComponentFixture<NotesPageComponent>;
  let mockNotesService: jest.Mocked<Pick<NotesService, 'getNotes' | 'createNote' | 'updateNote' | 'deleteNote'>>;
  let mockDialog: jest.Mocked<Pick<MatDialog, 'open'>>;
  let mockToast: jest.Mocked<Pick<ToastService, 'error'>>;

  beforeEach(async () => {
    mockNotesService = {
      getNotes: jest.fn().mockReturnValue(of([])),
      createNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
    };
    mockDialog = { open: jest.fn() };
    mockToast = { error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [NotesPageComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync('noop'),
        { provide: NotesService, useValue: mockNotesService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads notes on init', () => {
    expect(mockNotesService.getNotes).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no notes', () => {
    expect(component.notes()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('populates notes signal after load', () => {
    const notes = [mockNote({ id: 1 }), mockNote({ id: 2, title: 'Second' })];
    mockNotesService.getNotes.mockReturnValue(of(notes));
    component.ngOnInit();
    expect(component.notes()).toHaveLength(2);
  });

  it('shows error toast when notes fail to load', () => {
    mockNotesService.getNotes.mockReturnValue(throwError(() => new Error('Network error')));
    component.ngOnInit();
    expect(mockToast.error).toHaveBeenCalledWith('Failed to load notes');
    expect(component.loading()).toBe(false);
  });

  it('adds note to the top of the list after creation', () => {
    const existing = mockNote({ id: 1, title: 'Old' });
    const created = mockNote({ id: 2, title: 'New' });

    component.notes.set([existing]);
    mockNotesService.createNote.mockReturnValue(of(created));
    mockDialog.open.mockReturnValue({ afterClosed: () => of({ title: 'New', color: '#fff' }) } as any);

    component.openCreateDialog();
    expect(component.notes()[0]).toEqual(created);
    expect(component.notes()).toHaveLength(2);
  });

  it('shows error toast when create fails', () => {
    mockNotesService.createNote.mockReturnValue(throwError(() => new Error('fail')));
    mockDialog.open.mockReturnValue({ afterClosed: () => of({ title: 'x', color: '#fff' }) } as any);
    component.openCreateDialog();
    expect(mockToast.error).toHaveBeenCalledWith('Failed to create note');
  });

  it('updates note in list after edit', () => {
    const original = mockNote({ id: 1, title: 'Original' });
    const updated = mockNote({ id: 1, title: 'Updated' });
    component.notes.set([original]);
    mockNotesService.updateNote.mockReturnValue(of(updated));
    mockDialog.open.mockReturnValue({ afterClosed: () => of({ title: 'Updated', color: '#fff' }) } as any);

    component.openEditDialog(original);
    expect(component.notes()[0].title).toBe('Updated');
  });

  it('shows error toast when update fails', () => {
    const note = mockNote();
    component.notes.set([note]);
    mockNotesService.updateNote.mockReturnValue(throwError(() => new Error('fail')));
    mockDialog.open.mockReturnValue({ afterClosed: () => of({ title: 'x' }) } as any);
    component.openEditDialog(note);
    expect(mockToast.error).toHaveBeenCalledWith('Failed to update note');
  });

  it('removes note from list on delete', () => {
    const note = mockNote({ id: 1 });
    component.notes.set([note]);
    mockNotesService.deleteNote.mockReturnValue(of(undefined as any));

    const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
    component.deleteNote(note, event);
    expect(component.notes()).toHaveLength(0);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('shows error toast when delete fails', () => {
    const note = mockNote();
    component.notes.set([note]);
    mockNotesService.deleteNote.mockReturnValue(throwError(() => new Error('fail')));

    const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;
    component.deleteNote(note, event);
    expect(mockToast.error).toHaveBeenCalledWith('Failed to delete note');
  });
});
