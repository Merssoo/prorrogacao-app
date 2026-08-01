import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { VotingPageRoutingModule } from './voting-routing.module';

import { VotingPage } from './voting.page';

@NgModule({
  imports: [
    SharedModule,
    VotingPageRoutingModule
  ],
  declarations: [VotingPage]
})
export class VotingPageModule {}
