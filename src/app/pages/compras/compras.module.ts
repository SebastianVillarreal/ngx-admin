import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbActionsModule,
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
    FormsModule,
    ReactiveFormsModule,
    Ng2SmartTableModule,
  ],
  declarations: [
    ComprasComponent,
    ArticulosComponent,
    NuevoArticuloComponent,
  ],
})
export class ComprasModule { }
