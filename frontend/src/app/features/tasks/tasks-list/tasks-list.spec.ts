import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TasksListComponent } from './tasks-list';
import { TaskService } from '../tasks.service';
import { Task } from '../tasks.model';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1, title: 'Task', description: null, dueDate: null,
  priority: 2, status: 'todo', completed: false,
  originalStatus: 'todo', createdAt: '', updatedAt: '',
  ...overrides,
});

describe('TasksListComponent', () => {
  let component: TasksListComponent;
  let fixture: ComponentFixture<TasksListComponent>;
  let mockTaskService: jest.Mocked<Pick<TaskService, 'getTasks' | 'updateTask' | 'deleteTask' | 'createTask'>>;
  let mockDialog: jest.Mocked<Pick<MatDialog, 'open'>>;
  let mockSnack: jest.Mocked<Pick<MatSnackBar, 'open'>>;

  beforeEach(async () => {
    mockTaskService = {
      getTasks: jest.fn().mockReturnValue(of([])),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      createTask: jest.fn(),
    };
    mockDialog = { open: jest.fn() };
    mockSnack = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [TasksListComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync('noop'),
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnack },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads tasks on init', () => {
    expect(mockTaskService.getTasks).toHaveBeenCalledTimes(1);
  });

  it('starts with empty task list', () => {
    expect(component.tasks()).toEqual([]);
  });

  it('sets loading to false after tasks load', () => {
    expect(component.loading()).toBe(false);
  });

  it('populates tasks signal after successful load', () => {
    const tasks = [makeTask({ id: 1, title: 'A' }), makeTask({ id: 2, title: 'B' })];
    mockTaskService.getTasks.mockReturnValue(of(tasks));
    component.load();
    expect(component.tasks()).toHaveLength(2);
  });

  it('activeCount returns incomplete tasks', () => {
    component.tasks.set([
      makeTask({ id: 1, completed: false }),
      makeTask({ id: 2, completed: true }),
      makeTask({ id: 3, completed: false }),
    ]);
    expect(component.activeCount).toBe(2);
  });

  it('completedCount returns completed tasks', () => {
    component.tasks.set([
      makeTask({ id: 1, completed: true }),
      makeTask({ id: 2, completed: false }),
    ]);
    expect(component.completedCount).toBe(1);
  });

  it('filteredTasks filters by search term', () => {
    component.tasks.set([
      makeTask({ id: 1, title: 'Buy groceries' }),
      makeTask({ id: 2, title: 'Fix bug' }),
    ]);
    component.searchTerm.set('grocer');
    expect(component.filteredTasks()).toHaveLength(1);
    expect(component.filteredTasks()[0].title).toBe('Buy groceries');
  });

  it('filteredTasks filters by status', () => {
    component.tasks.set([
      makeTask({ id: 1, status: 'todo' }),
      makeTask({ id: 2, status: 'done' }),
    ]);
    component.statusFilter.set('done');
    expect(component.filteredTasks()).toHaveLength(1);
    expect(component.filteredTasks()[0].status).toBe('done');
  });

  it('toggleView switches between list and board', () => {
    expect(component.viewMode()).toBe('list');
    component.toggleView();
    expect(component.viewMode()).toBe('board');
    component.toggleView();
    expect(component.viewMode()).toBe('list');
  });
});
