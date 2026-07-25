import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { EventoPageRoutingModule } from './evento-routing.module';

import { EventoPage } from './evento.page';

@NgModule({
  imports: [
    SharedModule,
    EventoPageRoutingModule
  ],
  declarations: [EventoPage]
})
export class EventoPageModule {}
