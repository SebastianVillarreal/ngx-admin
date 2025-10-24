import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SistemasComponent } from './sistemas.component';
import { EntradasComponent } from './entradas/entradas.component';

const routes: Routes = [
  {
    path: '',
    component: SistemasComponent,
    children: [
      {
        path: 'entradas',
        component: EntradasComponent,
      },
      {
        path: '',
        redirectTo: 'entradas',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SistemasRoutingModule {}
