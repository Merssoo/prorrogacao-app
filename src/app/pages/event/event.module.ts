import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { EventPageRoutingModule } from './event-routing.module';

import { EventPage } from './event.page';

@NgModule({
  imports: [
    SharedModule,
    EventPageRoutingModule
  ],
  declarations: [EventPage]
})
export class EventPageModule {}
