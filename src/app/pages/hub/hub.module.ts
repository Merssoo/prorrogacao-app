import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { HubPageRoutingModule } from './hub-routing.module';

import { HubPage } from './hub.page';

@NgModule({
  imports: [
    SharedModule,
    HubPageRoutingModule
  ],
  declarations: [HubPage]
})
export class HubPageModule {}
