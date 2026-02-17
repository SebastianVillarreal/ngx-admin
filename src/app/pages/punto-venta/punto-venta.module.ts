import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
} from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThemeModule } from '../../@theme/theme.module';
import { PuntoVentaRoutingModule } from './punto-venta-routing.module';
import { PuntoVentaComponent } from './punto-venta.component';
import { PuntoVentaAplicacionComponent } from './tabs/aplicacion/punto-venta-aplicacion.component';
import { PuntoVentaCodigosKioscoComponent } from './tabs/codigos-kiosco/punto-venta-codigos-kiosco.component';
import { PuntoVentaLibroAntibioticosComponent } from './tabs/libro-antibioticos/punto-venta-libro-antibioticos.component';
import { PuntoVentaReportesComponent } from './tabs/reportes/punto-venta-reportes.component';
import { PuntoVentaDevolucionesPagadasComponent } from './tabs/reportes/devoluciones-pagadas/punto-venta-devoluciones-pagadas.component';
import { PuntoVentaOperacionesCashbackComponent } from './tabs/reportes/operaciones-cashback/punto-venta-operaciones-cashback.component';
import { PuntoVentaPolizaIngresosComponent } from './tabs/reportes/poliza-ingresos/punto-venta-poliza-ingresos.component';

@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    NbCardModule,
    NbDialogModule.forChild(),
    NbInputModule,
    NbButtonModule,
    NbSelectModule,
    NbIconModule,
    NbAlertModule,
    NbSpinnerModule,
    NbTabsetModule,
    FormsModule,
    ReactiveFormsModule,
    PuntoVentaRoutingModule,
  ],
  declarations: [
    PuntoVentaComponent,
    PuntoVentaAplicacionComponent,
    PuntoVentaCodigosKioscoComponent,
    PuntoVentaLibroAntibioticosComponent,
    PuntoVentaReportesComponent,
    PuntoVentaDevolucionesPagadasComponent,
    PuntoVentaOperacionesCashbackComponent,
    PuntoVentaPolizaIngresosComponent,
  ],
})
export class PuntoVentaModule {}
