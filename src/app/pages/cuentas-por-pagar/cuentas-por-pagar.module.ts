import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbActionsModule,
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { CuentasPorPagarRoutingModule } from './cuentas-por-pagar-routing.module';
import { CuentasPorPagarComponent } from './cuentas-por-pagar.component';
import { FacturasComponent } from './facturas/facturas.component';
import { NotasDeCargoComponent } from './notas-de-cargo/notas-de-cargo.component';
import { NotasDeCargoInsertarComponent } from './notas-de-cargo-insertar/notas-de-cargo-insertar.component';
import { NotasDeCargoListaComponent } from './notas-de-cargo-lista/notas-de-cargo-lista.component';
import { PagosReportesComponent } from './pagos-reportes/pagos-reportes.component';
import { PagosSpeiComponent } from './pagos-spei/pagos-spei.component';
import { PagosSpeiListComponent } from './pagos-spei-list/pagos-spei-list.component';
import { RemisionFacturaComponent } from './remision-factura/remision-factura.component';
import { VerificadorPagosComponent } from './verificador-pagos/verificador-pagos.component';

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
    NbAlertModule,
    NbDatepickerModule,
    NbSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    CuentasPorPagarComponent,
    FacturasComponent,
    NotasDeCargoComponent,
    NotasDeCargoInsertarComponent,
    NotasDeCargoListaComponent,
    PagosReportesComponent,
    PagosSpeiComponent,
    PagosSpeiListComponent,
    RemisionFacturaComponent,
    VerificadorPagosComponent,
  ],
})
export class CuentasPorPagarModule {}
