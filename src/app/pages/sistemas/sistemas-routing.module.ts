import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SistemasComponent } from './sistemas.component';
import { EntradasComponent } from './entradas/entradas.component';
import { OfertasComponent } from './ofertas/ofertas.component';
import { OfertasAddComponent } from './ofertas/tabs/ofertas-add.component';
import { OfertasActivasComponent } from './ofertas/tabs/ofertas-activas.component';
import { OfertasBuscarComponent } from './ofertas/tabs/ofertas-buscar.component';
import { OfertasHistoricoComponent } from './ofertas/tabs/ofertas-historico.component';
import { SolicitudEtiquetsComponent } from './solicitud-de-etiquets/solicitud-de-etiquets.component';
import { SolicitudEtiquetsListaComponent } from './solicitud-de-etiquets/lista/solicitud-de-etiquets-lista.component';
import { DeptoBasculasComponent } from './depto-basculas/depto-basculas.component';

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
        path: 'solicitud-de-etiquetas',
        component: SolicitudEtiquetsComponent,
      },
      {
        path: 'solicitud-de-etiquetas/lista',
        component: SolicitudEtiquetsListaComponent,
      },
      {
        path: 'depto-basculas',
        component: DeptoBasculasComponent,
      },
      {
        path: 'solicitud-de-etiquets',
        redirectTo: 'solicitud-de-etiquetas',
        pathMatch: 'full',
      },
      {
        path: 'solicitud-de-etiquets/lista',
        redirectTo: 'solicitud-de-etiquetas/lista',
        pathMatch: 'full',
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
