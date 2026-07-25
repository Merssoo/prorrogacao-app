import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { FinanceiroPageRoutingModule } from './financeiro-routing.module';

import { FinanceiroPage } from './financeiro.page';

@NgModule({
  imports: [
    SharedModule,
    FinanceiroPageRoutingModule
  ],
  declarations: [FinanceiroPage]
})
export class FinanceiroPageModule {}
