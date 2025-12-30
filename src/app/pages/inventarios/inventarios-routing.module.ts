import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MovimientosComponent } from './movimientos/movimientos.component';
import { EditarAutorizarComponent } from './movimientos/editar-autorizar/editar-autorizar.component';
import { VerificadorComponent } from './verificador/verificador.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'movimientos',
    pathMatch: 'full',
  },
  {
    path: 'movimientos',
    component: MovimientosComponent,
  },
  {
    path: 'movimientos/editar-autorizar',
    component: EditarAutorizarComponent,
  },
  {
    path: 'verificador',
    component: VerificadorComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventariosRoutingModule {}
