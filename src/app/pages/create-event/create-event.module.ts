import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CreateEventPageRoutingModule } from './create-event-routing.module';

import { CreateEventPage } from './create-event.page';

@NgModule({
  imports: [
    SharedModule,
    CreateEventPageRoutingModule
  ],
  declarations: [CreateEventPage]
})
export class CreateEventPageModule {}
