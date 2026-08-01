import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { DraftPageRoutingModule } from './draft-routing.module';

import { DraftPage } from './draft.page';

@NgModule({
  imports: [
    SharedModule,
    DraftPageRoutingModule
  ],
  declarations: [DraftPage]
})
export class DraftPageModule {}
