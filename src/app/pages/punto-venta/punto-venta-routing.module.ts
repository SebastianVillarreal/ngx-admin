import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntoVentaComponent } from './punto-venta.component';
import { PuntoVentaAplicacionComponent } from './tabs/aplicacion/punto-venta-aplicacion.component';
import { PuntoVentaCodigosKioscoComponent } from './tabs/codigos-kiosco/punto-venta-codigos-kiosco.component';
import { PuntoVentaLibroAntibioticosComponent } from './tabs/libro-antibioticos/punto-venta-libro-antibioticos.component';
import { PuntoVentaReportesComponent } from './tabs/reportes/punto-venta-reportes.component';
import { PuntoVentaDevolucionesPagadasComponent } from './tabs/reportes/devoluciones-pagadas/punto-venta-devoluciones-pagadas.component';
import { PuntoVentaOperacionesCashbackComponent } from './tabs/reportes/operaciones-cashback/punto-venta-operaciones-cashback.component';
import { PuntoVentaPolizaIngresosComponent } from './tabs/reportes/poliza-ingresos/punto-venta-poliza-ingresos.component';

const routes: Routes = [
  {
    path: '',
    component: PuntoVentaComponent,
    children: [
      {
        path: 'aplicacion',
        component: PuntoVentaAplicacionComponent,
      },
      {
        path: 'libro-antibioticos',
        component: PuntoVentaLibroAntibioticosComponent,
      },
      {
        path: 'codigos-kiosco',
        component: PuntoVentaCodigosKioscoComponent,
      },
      {
        path: 'reportes',
        children: [
          {
            path: 'tickets',
            component: PuntoVentaReportesComponent,
          },
          {
            path: 'devoluciones-pagadas',
            component: PuntoVentaDevolucionesPagadasComponent,
          },
          {
            path: 'poliza-ingresos',
            component: PuntoVentaPolizaIngresosComponent,
          },
          {
            path: 'operaciones-cashback',
            component: PuntoVentaOperacionesCashbackComponent,
          },
          {
            path: '',
            redirectTo: 'tickets',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: '',
        redirectTo: 'aplicacion',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PuntoVentaRoutingModule {}
