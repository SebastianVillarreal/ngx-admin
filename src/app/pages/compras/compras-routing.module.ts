import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComprasComponent } from './compras.component';
import { ArticulosComponent } from './articulos/articulos.component';
import { NuevoArticuloComponent } from './articulos/nuevo-articulo.component';

const routes: Routes = [
  {
    path: '',
    component: ComprasComponent,
    children: [
      {
        path: 'articulos',
        component: ArticulosComponent,
      },
      {
        path: 'articulos/nuevo',
        component: NuevoArticuloComponent,
      },
      {
        path: '',
        redirectTo: 'articulos',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComprasRoutingModule {}
