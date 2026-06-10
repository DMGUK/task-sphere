import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TaskEditDialogComponent } from './task-edit-dialog';

describe('TaskEditDialogComponent', () => {
  let component: TaskEditDialogComponent;
  let fixture: ComponentFixture<TaskEditDialogComponent>;
  let mockDialogRef: jest.Mocked<Pick<MatDialogRef<TaskEditDialogComponent>, 'close'>>;

  function setup(data: object) {
    mockDialogRef = { close: jest.fn() };
    return TestBed.configureTestingModule({
      imports: [TaskEditDialogComponent],
      providers: [
        provideAnimationsAsync('noop'),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
  }

  afterEach(() => TestBed.resetTestingModule());

  describe('create mode', () => {
    beforeEach(async () => {
      await setup({ mode: 'create', task: {} });
      fixture = TestBed.createComponent(TaskEditDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('initialises with empty title', () => {
      expect(component.form.value.title).toBe('');
    });

    it('save() is blocked when form is invalid (empty title)', () => {
      component.save();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('save() closes with form values when valid', () => {
      component.form.patchValue({ title: 'New task' });
      component.save();
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New task' })
      );
    });

    it('cancel() closes with null', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      await setup({
        mode: 'edit',
        task: { id: 1, title: 'Existing task', description: 'Some details', priority: 0 },
      });
      fixture = TestBed.createComponent(TaskEditDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('pre-fills the form with the task values', () => {
      expect(component.form.value.title).toBe('Existing task');
      expect(component.form.value.description).toBe('Some details');
      expect(component.form.value.priority).toBe(0);
    });

    it('save() closes with the updated values', () => {
      component.form.patchValue({ title: 'Updated title' });
      component.save();
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated title' })
      );
    });
  });
});
