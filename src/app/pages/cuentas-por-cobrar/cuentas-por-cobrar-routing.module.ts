import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CuentasPorCobrarComponent } from './cuentas-por-cobrar.component';
import { ClientesComponent } from './clientes/clientes.component';

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
