import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { TasksRoutingModule } from './tasks-routing-module';
import { TasksListComponent } from './tasks-list/tasks-list';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TasksRoutingModule,
    TasksListComponent,   // your standalone component
    MatListModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
  ]
})
export class TasksModule {}
