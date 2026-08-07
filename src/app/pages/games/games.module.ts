import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { GamesPageRoutingModule } from './games-routing.module';

import { GamesPage } from './games.page';

@NgModule({
  imports: [
    SharedModule,
    GamesPageRoutingModule
  ],
  declarations: [GamesPage]
})
export class GamesPageModule {}
