import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { CuentasPorPagarRoutingModule } from './cuentas-por-pagar-routing.module';
import { CuentasPorPagarComponent } from './cuentas-por-pagar.component';
import { PagosSpeiComponent } from './pagos-spei/pagos-spei.component';
import { PagosSpeiListComponent } from './pagos-spei-list/pagos-spei-list.component';

@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    CuentasPorPagarRoutingModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbSelectModule,
    NbIconModule,
    NbActionsModule,
    NbDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [CuentasPorPagarComponent, PagosSpeiComponent, PagosSpeiListComponent],
})
export class CuentasPorPagarModule {}
