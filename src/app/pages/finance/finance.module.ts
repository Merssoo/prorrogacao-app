import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { FinancePageRoutingModule } from './finance-routing.module';

import { FinancePage } from './finance.page';

@NgModule({
  imports: [
    SharedModule,
    FinancePageRoutingModule
  ],
  declarations: [FinancePage]
})
export class FinancePageModule {}
