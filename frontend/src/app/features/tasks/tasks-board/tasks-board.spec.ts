import { ComponentFixture, NO_ERRORS_SCHEMA, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { TasksBoardComponent } from './tasks-board';
import { TaskService } from '../tasks.service';
import { Task } from '../tasks.model';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1, title: 'Task', description: null, dueDate: null,
  priority: 2, status: 'todo', completed: false,
  originalStatus: 'todo', createdAt: '', updatedAt: '',
  ...overrides,
});

describe('TasksBoardComponent', () => {
  let component: TasksBoardComponent;
  let fixture: ComponentFixture<TasksBoardComponent>;
  let mockTaskService: jest.Mocked<Pick<TaskService, 'getTasks' | 'updateTask' | 'deleteTask'>>;
  let mockSnack: jest.Mocked<Pick<MatSnackBar, 'open'>>;
  let mockDialog: jest.Mocked<Pick<MatDialog, 'open'>>;

  beforeEach(async () => {
    mockTaskService = {
      getTasks: jest.fn().mockReturnValue(of([])),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    };
    mockSnack = { open: jest.fn() };
    mockDialog = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [TasksBoardComponent],
      providers: [
        provideAnimationsAsync('noop'),
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatSnackBar, useValue: mockSnack },
        { provide: MatDialog, useValue: mockDialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksBoardComponent);
    component = fixture.componentInstance;
    component.tasks = [];
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts with empty board columns', () => {
    expect(component.columns.todo).toEqual([]);
    expect(component.columns.in_progress).toEqual([]);
    expect(component.columns.done).toEqual([]);
  });

  it('distributes tasks into correct columns on ngOnChanges', () => {
    const tasks = [
      makeTask({ id: 1, status: 'todo' }),
      makeTask({ id: 2, status: 'in_progress' }),
      makeTask({ id: 3, status: 'done' }),
    ];
    component.tasks = tasks;
    component.ngOnChanges({
      tasks: new SimpleChange([], tasks, false),
    });
    expect(component.columns.todo).toHaveLength(1);
    expect(component.columns.in_progress).toHaveLength(1);
    expect(component.columns.done).toHaveLength(1);
  });

  it('places multiple tasks in the same column', () => {
    const tasks = [
      makeTask({ id: 1, status: 'todo' }),
      makeTask({ id: 2, status: 'todo' }),
      makeTask({ id: 3, status: 'done' }),
    ];
    component.tasks = tasks;
    component.ngOnChanges({
      tasks: new SimpleChange([], tasks, false),
    });
    expect(component.columns.todo).toHaveLength(2);
    expect(component.columns.done).toHaveLength(1);
  });
});
