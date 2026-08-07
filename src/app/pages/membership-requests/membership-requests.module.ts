import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { MembershipRequestsPageRoutingModule } from './membership-requests-routing.module';

import { MembershipRequestsPage } from './membership-requests.page';

@NgModule({
  imports: [
    SharedModule,
    MembershipRequestsPageRoutingModule
  ],
  declarations: [MembershipRequestsPage]
})
export class MembershipRequestsPageModule {}
