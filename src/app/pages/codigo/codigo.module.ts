import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CodigoPageRoutingModule } from './codigo-routing.module';

import { CodigoPage } from './codigo.page';

@NgModule({
  imports: [
    SharedModule,
    CodigoPageRoutingModule
  ],
  declarations: [CodigoPage]
})
export class CodigoPageModule {}
