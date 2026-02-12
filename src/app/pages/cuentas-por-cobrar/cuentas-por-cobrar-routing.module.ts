import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CuentasPorCobrarComponent } from './cuentas-por-cobrar.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CreditosComponent } from './creditos/creditos.component';
import { CreditosDetalleComponent } from './creditos/detalle/creditos-detalle.component';
import { FoliosPagosComponent } from './creditos/folios-pagos/folios-pagos.component';
import { CorteAbonosComponent } from './creditos/corte-abonos/corte-abonos.component';
import { HistoricoComponent } from './creditos/historico/historico.component';
import { SeparadosExistenciasComponent } from './separados/existencias/existencias.component';
import { EstadoCuentaComponent } from './reportes/estado-cuenta/estado-cuenta.component';
import { EstadoCuentaPeriodoComponent } from './reportes/estado-cuenta-periodo/estado-cuenta-periodo.component';

const routes: Routes = [
  {
    path: '',
    component: CuentasPorCobrarComponent,
    children: [
      {
        path: 'clientes',
        component: ClientesComponent,
      },
      {
        path: 'creditos',
        component: CreditosComponent,
      },
      {
        path: 'creditos/folios-pagos',
        component: FoliosPagosComponent,
      },
      {
        path: 'creditos/corte-abonos',
        component: CorteAbonosComponent,
      },
      {
        path: 'creditos/historico',
        component: HistoricoComponent,
      },
      {
        path: 'creditos/detalle/:id',
        component: CreditosDetalleComponent,
      },
      {
        path: 'separados/existencias',
        component: SeparadosExistenciasComponent,
      },
      {
        path: 'reportes/estado-cuenta',
        component: EstadoCuentaComponent,
      },
      {
        path: 'reportes/estado-cuenta-periodo',
        component: EstadoCuentaPeriodoComponent,
      },
      {
        path: '',
        redirectTo: 'clientes',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuentasPorCobrarRoutingModule {}
