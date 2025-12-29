import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule,
  NbSelectModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { CuentasPorCobrarRoutingModule } from './cuentas-por-cobrar-routing.module';
import { CuentasPorCobrarComponent } from './cuentas-por-cobrar.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CreditosComponent } from './creditos/creditos.component';
import { CreditosDetalleComponent } from './creditos/detalle/creditos-detalle.component';
import { FoliosPagosComponent } from './creditos/folios-pagos/folios-pagos.component';
import { CorteAbonosComponent } from './creditos/corte-abonos/corte-abonos.component';
import { HistoricoComponent } from './creditos/historico/historico.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    NbDialogModule.forChild(),
  ],
  declarations: [
    CuentasPorCobrarComponent,
    ClientesComponent,
    CreditosComponent,
    CreditosDetalleComponent,
    FoliosPagosComponent,
    CorteAbonosComponent,
    HistoricoComponent,
  ],
})
export class CuentasPorCobrarModule {}
