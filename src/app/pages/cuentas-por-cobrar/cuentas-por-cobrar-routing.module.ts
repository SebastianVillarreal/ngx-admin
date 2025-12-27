import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CuentasPorCobrarComponent } from './cuentas-por-cobrar.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CreditosComponent } from './creditos/creditos.component';
import { CreditosDetalleComponent } from './creditos/detalle/creditos-detalle.component';

const routes: Routes = [
  {
    path: '',
    component: CuentasPorCobrarComponent,
    children: [
      {
        path: 'clientes',
        component: ClientesComponent,
      },
      {
        path: 'creditos',
        component: CreditosComponent,
      },
      {
        path: 'creditos/detalle/:id',
        component: CreditosDetalleComponent,
      },
      {
        path: '',
        redirectTo: 'clientes',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuentasPorCobrarRoutingModule {}
