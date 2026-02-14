import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CuentasPorPagarComponent } from './cuentas-por-pagar.component';
import { FacturasComponent } from './facturas/facturas.component';
import { NotasDeCargoComponent } from './notas-de-cargo/notas-de-cargo.component';
import { PagosReportesComponent } from './pagos-reportes/pagos-reportes.component';
import { PagosSpeiComponent } from './pagos-spei/pagos-spei.component';
import { PagosSpeiListComponent } from './pagos-spei-list/pagos-spei-list.component';
import { RemisionFacturaComponent } from './remision-factura/remision-factura.component';
import { VerificadorPagosComponent } from './verificador-pagos/verificador-pagos.component';

const routes: Routes = [
  {
    path: '',
    component: CuentasPorPagarComponent,
    children: [
      {
        path: 'facturas',
        component: FacturasComponent,
        children: [
          {
            path: 'remision-a-factura',
            component: RemisionFacturaComponent,
          },
          {
            path: '',
            redirectTo: 'remision-a-factura',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'pagos-spei',
        component: PagosSpeiComponent,
      },
      {
        path: 'notas-de-cargo',
        component: NotasDeCargoComponent,
      },
      {
        path: 'pagos-spei/lista',
        component: PagosSpeiListComponent,
      },
      {
        path: 'pagos/historico-pagos',
        component: PagosSpeiListComponent,
      },
      {
        path: 'pagos/verificador-pagos',
        component: VerificadorPagosComponent,
      },
      {
        path: 'pagos/reportes',
        component: PagosReportesComponent,
      },
      {
        path: '',
        redirectTo: 'pagos-spei',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuentasPorPagarRoutingModule {}
