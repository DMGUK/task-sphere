import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksBoard } from './tasks-board';

describe('TasksBoard', () => {
  let component: TasksBoard;
  let fixture: ComponentFixture<TasksBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TasksBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
