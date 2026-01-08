import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { InventariosRoutingModule } from './inventarios-routing.module';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { EditarAutorizarComponent } from './movimientos/editar-autorizar/editar-autorizar.component';
import { HistoricoComponent } from './movimientos/historico/historico.component';
import { VerificadorComponent } from './verificador/verificador.component';
import { ImportarFisicosComponent } from './importar-fisicos/importar-fisicos.component';
import { RepartoMermasComponent } from './reparto-mermas/reparto-mermas.component';
import { TraspasosComponent } from './traspasos/traspasos.component';
import { RecibirTraspasosComponent } from './recibir-traspasos/recibir-traspasos.component';
import { TraspasosEnTransitoComponent } from './traspasos-en-transito/traspasos-en-transito.component';
import { TraspasosEnviadosComponent } from './traspasos-enviados/traspasos-enviados.component';

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
    NbDialogModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbSpinnerModule,
  ],
  declarations: [
    MovimientosComponent,
    VerificadorComponent,
    EditarAutorizarComponent,
    HistoricoComponent,
    ImportarFisicosComponent,
    RepartoMermasComponent,
    TraspasosComponent,
    RecibirTraspasosComponent,
    TraspasosEnTransitoComponent,
    TraspasosEnviadosComponent,
  ],
})
export class InventariosModule {}
