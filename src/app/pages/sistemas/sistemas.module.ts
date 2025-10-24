import { NgModule } from '@angular/core';
import { ThemeModule } from '../../@theme/theme.module';
import { SistemasRoutingModule } from './sistemas-routing.module';
import { SistemasComponent } from './sistemas.component';

import { NbCardModule, NbInputModule, NbButtonModule, NbCheckboxModule, NbSelectModule, NbIconModule, NbActionsModule } from '@nebular/theme';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EntradasComponent } from './entradas/entradas.component';

@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    SistemasRoutingModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbSelectModule,
    NbIconModule,
    NbActionsModule,
    FormsModule,
  ],
  declarations: [
    SistemasComponent,
    EntradasComponent,
  ],
})
export class SistemasModule { }
