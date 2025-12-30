import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { InventariosRoutingModule } from './inventarios-routing.module';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { VerificadorComponent } from './verificador/verificador.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ThemeModule,
    InventariosRoutingModule,
    NbCardModule,
    NbAutocompleteModule,
    NbAlertModule,
    NbButtonModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbSpinnerModule,
  ],
  declarations: [MovimientosComponent, VerificadorComponent],
})
export class InventariosModule {}
