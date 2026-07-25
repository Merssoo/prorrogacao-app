import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { VotacaoPageRoutingModule } from './votacao-routing.module';

import { VotacaoPage } from './votacao.page';

@NgModule({
  imports: [
    SharedModule,
    VotacaoPageRoutingModule
  ],
  declarations: [VotacaoPage]
})
export class VotacaoPageModule {}
