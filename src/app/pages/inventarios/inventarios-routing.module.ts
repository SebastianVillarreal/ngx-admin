import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MovimientosComponent } from './movimientos/movimientos.component';

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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventariosRoutingModule {}
