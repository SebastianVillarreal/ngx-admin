import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbActionsModule,
  NbAlertModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbIconModule,
  NbInputModule,
  NbRouteTabsetModule,
  NbSelectModule,
  NbSpinnerModule,
} from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { ComprasRoutingModule } from './compras-routing.module';
import { ComprasComponent } from './compras.component';
import { ArticulosComponent } from './articulos/articulos.component';
import { ArticuloToggleCellComponent } from './articulos/articulo-toggle-cell.component';
import { CambiosPrecioComponent } from './articulos/cambios-precio.component';
import { NuevoArticuloComponent } from './articulos/nuevo-articulo.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { CotizacionesListaComponent } from './cotizaciones/cotizaciones-lista.component';
import { CotizacionesPedidoSugeridoComponent } from './cotizaciones/cotizaciones-pedido-sugerido.component';
import { CotizacionesSinFinalizarComponent } from './cotizaciones/cotizaciones-sin-finalizar.component';
import { ListaPreciosDetalleComponent } from './proveedores/lista-precios-detalle.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { ProveedoresListasPreciosComponent } from './proveedores/listas-precios.component';
import { MargenesFamiliasComponent } from './margenes-familias/margenes-familias.component';
import { PreciosProgramadosComponent } from './precios-programados/precios-programados.component';
import { IepsEspecialComponent } from './ieps-especial/ieps-especial.component';
import { IepsEspecialCrudComponent } from './ieps-especial/tabs/ieps-especial-crud.component';
import { IepsEspecialReporteComponent } from './ieps-especial/tabs/ieps-especial-reporte.component';

@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    ComprasRoutingModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbSelectModule,
    NbIconModule,
    NbAlertModule,
    NbSpinnerModule,
    NbRouteTabsetModule,
    NbActionsModule,
    NbAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    Ng2SmartTableModule,
  ],
  declarations: [
    ComprasComponent,
    ArticuloToggleCellComponent,
    ArticulosComponent,
    CambiosPrecioComponent,
    NuevoArticuloComponent,
    CotizacionesComponent,
    CotizacionesListaComponent,
    CotizacionesPedidoSugeridoComponent,
    CotizacionesSinFinalizarComponent,
    ListaPreciosDetalleComponent,
    ProveedoresComponent,
    ProveedoresListasPreciosComponent,
    MargenesFamiliasComponent,
    PreciosProgramadosComponent,
    IepsEspecialComponent,
    IepsEspecialCrudComponent,
    IepsEspecialReporteComponent,
  ],
})
export class ComprasModule { }
