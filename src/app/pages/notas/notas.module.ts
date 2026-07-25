import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { NotasPageRoutingModule } from './notas-routing.module';

import { NotasPage } from './notas.page';

@NgModule({
  imports: [
    SharedModule,
    NotasPageRoutingModule
  ],
  declarations: [NotasPage]
})
export class NotasPageModule {}
