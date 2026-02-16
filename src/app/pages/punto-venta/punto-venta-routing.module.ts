import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PuntoVentaComponent } from './punto-venta.component';
import { PuntoVentaAplicacionComponent } from './tabs/aplicacion/punto-venta-aplicacion.component';
import { PuntoVentaLibroAntibioticosComponent } from './tabs/libro-antibioticos/punto-venta-libro-antibioticos.component';
import { PuntoVentaReportesComponent } from './tabs/reportes/punto-venta-reportes.component';

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
        path: 'reportes',
        component: PuntoVentaReportesComponent,
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
