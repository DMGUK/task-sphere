import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesRoutingModule } from './notes-routing-module';
import { NotesPageComponent } from './notes-page/notes-page';

@NgModule({
  imports: [CommonModule, NotesRoutingModule, NotesPageComponent]
})
export class NotesModule {}
