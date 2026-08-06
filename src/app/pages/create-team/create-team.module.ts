import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { CreateTeamPageRoutingModule } from './create-team-routing.module';

import { CreateTeamPage } from './create-team.page';

@NgModule({
  imports: [
    SharedModule,
    CreateTeamPageRoutingModule
  ],
  declarations: [CreateTeamPage]
})
export class CreateTeamPageModule {}
