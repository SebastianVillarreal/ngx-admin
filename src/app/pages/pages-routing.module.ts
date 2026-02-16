import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    {
      path: 'home',
      component: HomeComponent,
    },
    {
      path: 'cuentas-por-pagar',
      loadChildren: () => import('./cuentas-por-pagar/cuentas-por-pagar.module')
        .then(m => m.CuentasPorPagarModule),
    },
    {
      path: 'cuentas-por-cobrar',
      loadChildren: () => import('./cuentas-por-cobrar/cuentas-por-cobrar.module')
        .then(m => m.CuentasPorCobrarModule),
    },
    {
      path: 'compras',
      loadChildren: () => import('./compras/compras.module')
        .then(m => m.ComprasModule),
    },
    {
      path: 'recibo',
      loadChildren: () => import('./recibo/recibo.module')
        .then(m => m.ReciboModule),
    },
    {
      path: 'sistemas',
      loadChildren: () => import('./sistemas/sistemas.module')
        .then(m => m.SistemasModule),
    },
    {
      path: 'catalogos',
      loadChildren: () => import('./catalogos/catalogos.module')
        .then(m => m.CatalogosModule),
    },
    {
      path: 'inventarios',
      loadChildren: () => import('./inventarios/inventarios.module')
        .then(m => m.InventariosModule),
    },
    {
      path: 'punto-venta',
      loadChildren: () => import('./punto-venta/punto-venta.module')
        .then(m => m.PuntoVentaModule),
    },
    {
      path: '',
      redirectTo: 'home',
      pathMatch: 'full',
    },
    {
      path: '**',
      redirectTo: 'home',
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
