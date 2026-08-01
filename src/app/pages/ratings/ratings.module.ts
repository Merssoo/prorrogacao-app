import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { RatingsPageRoutingModule } from './ratings-routing.module';

import { RatingsPage } from './ratings.page';

@NgModule({
  imports: [
    SharedModule,
    RatingsPageRoutingModule
  ],
  declarations: [RatingsPage]
})
export class RatingsPageModule {}
