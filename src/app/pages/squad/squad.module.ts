import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { SquadPageRoutingModule } from './squad-routing.module';

import { SquadPage } from './squad.page';

@NgModule({
  imports: [
    SharedModule,
    SquadPageRoutingModule
  ],
  declarations: [SquadPage]
})
export class SquadPageModule {}
