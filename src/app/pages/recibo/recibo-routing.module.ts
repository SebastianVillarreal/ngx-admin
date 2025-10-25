import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReciboComponent } from './recibo.component';
import { LibroDiarioComponent } from './libro-diario/libro-diario.component';

const routes: Routes = [
  {
    path: '',
    component: ReciboComponent,
    children: [
      {
        path: 'libro-diario',
        component: LibroDiarioComponent,
      },
      {
        path: '',
        redirectTo: 'libro-diario',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReciboRoutingModule {}
