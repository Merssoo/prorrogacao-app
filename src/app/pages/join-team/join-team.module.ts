import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { JoinTeamPageRoutingModule } from './join-team-routing.module';

import { JoinTeamPage } from './join-team.page';

@NgModule({
  imports: [
    SharedModule,
    JoinTeamPageRoutingModule
  ],
  declarations: [JoinTeamPage]
})
export class JoinTeamPageModule {}
