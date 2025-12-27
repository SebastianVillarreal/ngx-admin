import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule,
  NbSelectModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { CuentasPorCobrarRoutingModule } from './cuentas-por-cobrar-routing.module';
import { CuentasPorCobrarComponent } from './cuentas-por-cobrar.component';
import { ClientesComponent } from './clientes/clientes.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ThemeModule,
    CuentasPorCobrarRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbInputModule,
    NbSpinnerModule,
    NbAlertModule,
    NbCheckboxModule,
    NbSelectModule,
  ],
  declarations: [CuentasPorCobrarComponent, ClientesComponent],
})
export class CuentasPorCobrarModule {}
