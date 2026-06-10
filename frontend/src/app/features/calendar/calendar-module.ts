import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarRoutingModule } from './calendar-routing-module';
import { CalendarPageComponent } from './calendar-page/calendar-page';

@NgModule({
  imports: [CommonModule, CalendarRoutingModule, CalendarPageComponent]
})
export class CalendarModule {}
