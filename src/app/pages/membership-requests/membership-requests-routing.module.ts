import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MembershipRequestsPage } from './membership-requests.page';

const routes: Routes = [
  {
    path: '',
    component: MembershipRequestsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MembershipRequestsPageRoutingModule {}
