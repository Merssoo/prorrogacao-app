import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CriarEventoPageRoutingModule } from './criar-evento-routing.module';

import { CriarEventoPage } from './criar-evento.page';

@NgModule({
  imports: [
    SharedModule,
    CriarEventoPageRoutingModule
  ],
  declarations: [CriarEventoPage]
})
export class CriarEventoPageModule {}
