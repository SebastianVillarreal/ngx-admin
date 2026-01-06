import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComprasComponent } from './compras.component';
import { ArticulosComponent } from './articulos/articulos.component';
import { NuevoArticuloComponent } from './articulos/nuevo-articulo.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { CotizacionesListaComponent } from './cotizaciones/cotizaciones-lista.component';

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
        path: 'cotizaciones',
        component: CotizacionesComponent,
      },
      {
        path: 'cotizaciones/lista',
        component: CotizacionesListaComponent,
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
