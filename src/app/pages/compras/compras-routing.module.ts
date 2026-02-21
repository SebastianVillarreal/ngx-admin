import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComprasComponent } from './compras.component';
import { ArticulosComponent } from './articulos/articulos.component';
import { CambiosPrecioComponent } from './articulos/cambios-precio.component';
import { NuevoArticuloComponent } from './articulos/nuevo-articulo.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { CotizacionesListaComponent } from './cotizaciones/cotizaciones-lista.component';
import { CotizacionesPedidoSugeridoComponent } from './cotizaciones/cotizaciones-pedido-sugerido.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ListaPreciosDetalleComponent } from './proveedores/lista-precios-detalle.component';
import { ProveedoresListasPreciosComponent } from './proveedores/listas-precios.component';
import { MargenesFamiliasComponent } from './margenes-familias/margenes-familias.component';
import { PreciosProgramadosComponent } from './precios-programados/precios-programados.component';
import { IepsEspecialComponent } from './ieps-especial/ieps-especial.component';
import { IepsEspecialCrudComponent } from './ieps-especial/tabs/ieps-especial-crud.component';
import { IepsEspecialReporteComponent } from './ieps-especial/tabs/ieps-especial-reporte.component';

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
        path: 'articulos/cambios-precio',
        component: CambiosPrecioComponent,
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
        path: 'cotizaciones/pedido-sugerido',
        component: CotizacionesPedidoSugeridoComponent,
      },
      {
        path: 'proveedores',
        component: ProveedoresComponent,
      },
      {
        path: 'proveedores/listas-precios',
        component: ProveedoresListasPreciosComponent,
      },
      {
        path: 'proveedores/listas-precios/:id',
        component: ListaPreciosDetalleComponent,
      },
      {
        path: 'margenes-familias',
        component: MargenesFamiliasComponent,
      },
      {
        path: 'precios-programados',
        component: PreciosProgramadosComponent,
      },
      {
        path: 'ieps-especial',
        component: IepsEspecialComponent,
        children: [
          { path: 'crud', component: IepsEspecialCrudComponent },
          { path: 'reporte', component: IepsEspecialReporteComponent },
          { path: '', redirectTo: 'crud', pathMatch: 'full' },
        ],
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
