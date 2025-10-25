import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SistemasComponent } from './sistemas.component';
import { EntradasComponent } from './entradas/entradas.component';
import { OfertasComponent } from './ofertas/ofertas.component';
import { OfertasAddComponent } from './ofertas/tabs/ofertas-add.component';
import { OfertasActivasComponent } from './ofertas/tabs/ofertas-activas.component';
import { OfertasBuscarComponent } from './ofertas/tabs/ofertas-buscar.component';
import { OfertasHistoricoComponent } from './ofertas/tabs/ofertas-historico.component';

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
        path: 'ofertas',
        component: OfertasComponent,
        children: [
          { path: 'agregar', component: OfertasAddComponent },
          { path: 'activas', component: OfertasActivasComponent },
          { path: 'buscar', component: OfertasBuscarComponent },
          { path: 'historico', component: OfertasHistoricoComponent },
          { path: '', redirectTo: 'agregar', pathMatch: 'full' },
        ],
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
