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
import { PuntoVentaLibroAntibioticosComponent } from './tabs/libro-antibioticos/punto-venta-libro-antibioticos.component';
import { PuntoVentaReportesComponent } from './tabs/reportes/punto-venta-reportes.component';

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
    PuntoVentaLibroAntibioticosComponent,
    PuntoVentaReportesComponent,
  ],
})
export class PuntoVentaModule {}
