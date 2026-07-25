import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { SorteioPageRoutingModule } from './sorteio-routing.module';

import { SorteioPage } from './sorteio.page';

@NgModule({
  imports: [
    SharedModule,
    SorteioPageRoutingModule
  ],
  declarations: [SorteioPage]
})
export class SorteioPageModule {}
