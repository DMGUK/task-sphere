import { NgModule } from '@angular/core';

@NgModule({})
export class DragDropModule {}

export class CdkDragDrop<T = unknown> {
  previousContainer: any;
  container: any;
  previousIndex = 0;
  currentIndex = 0;
  item: any;
  data!: T;
}

export const moveItemInArray = jest.fn();
export const transferArrayItem = jest.fn();
export const copyArrayItem = jest.fn();
