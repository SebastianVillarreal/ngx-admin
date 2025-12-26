import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogosComponent } from './catalogos.component';
import { DepartamentosComponent } from './departamentos/departamentos.component';
import { FamiliasComponent } from './familias/familias.component';
import { MedicosComponent } from './medicos/medicos.component';

const routes: Routes = [
  {
    path: '',
    component: CatalogosComponent,
    children: [
      {
        path: 'departamentos',
        component: DepartamentosComponent,
      },
      {
        path: 'familias',
        component: FamiliasComponent,
      },
      {
        path: 'medicos',
        component: MedicosComponent,
      },
      {
        path: '',
        redirectTo: 'departamentos',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogosRoutingModule {}
