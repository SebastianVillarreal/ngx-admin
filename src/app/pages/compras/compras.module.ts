import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbActionsModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
} from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { ComprasRoutingModule } from './compras-routing.module';
import { ComprasComponent } from './compras.component';
import { ArticulosComponent } from './articulos/articulos.component';
import { NuevoArticuloComponent } from './articulos/nuevo-articulo.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { CotizacionesListaComponent } from './cotizaciones/cotizaciones-lista.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';

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
    NbActionsModule,
    NbAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    Ng2SmartTableModule,
  ],
  declarations: [
    ComprasComponent,
    ArticulosComponent,
    NuevoArticuloComponent,
    CotizacionesComponent,
    CotizacionesListaComponent,
    ProveedoresComponent,
  ],
})
export class ComprasModule { }
