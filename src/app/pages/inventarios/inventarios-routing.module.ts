import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MovimientosComponent } from './movimientos/movimientos.component';
import { EditarAutorizarComponent } from './movimientos/editar-autorizar/editar-autorizar.component';
import { HistoricoComponent } from './movimientos/historico/historico.component';
import { VerificadorComponent } from './verificador/verificador.component';
import { ImportarFisicosComponent } from './importar-fisicos/importar-fisicos.component';
import { RepartoMermasComponent } from './reparto-mermas/reparto-mermas.component';
import { TraspasosComponent } from './traspasos/traspasos.component';
import { RecibirTraspasosComponent } from './recibir-traspasos/recibir-traspasos.component';

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
    path: 'movimientos/historico',
    component: HistoricoComponent,
  },
  {
    path: 'verificador',
    component: VerificadorComponent,
  },
  {
    path: 'importar-fisicos',
    component: ImportarFisicosComponent,
  },
  {
    path: 'reparto-mermas',
    component: RepartoMermasComponent,
  },
  {
    path: 'traspasos',
    component: TraspasosComponent,
  },
  {
    path: 'recibir-traspasos',
    component: RecibirTraspasosComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventariosRoutingModule {}
