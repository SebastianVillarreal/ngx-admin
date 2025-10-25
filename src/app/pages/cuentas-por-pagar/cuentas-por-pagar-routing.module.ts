import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CuentasPorPagarComponent } from './cuentas-por-pagar.component';
import { PagosSpeiComponent } from './pagos-spei/pagos-spei.component';
import { PagosSpeiListComponent } from './pagos-spei-list/pagos-spei-list.component';

const routes: Routes = [
  {
    path: '',
    component: CuentasPorPagarComponent,
    children: [
      {
        path: 'pagos-spei',
        component: PagosSpeiComponent,
      },
      {
        path: 'pagos-spei/lista',
        component: PagosSpeiListComponent,
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
