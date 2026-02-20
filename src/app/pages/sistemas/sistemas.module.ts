import { NgModule } from '@angular/core';
import { ThemeModule } from '../../@theme/theme.module';
import { SistemasRoutingModule } from './sistemas-routing.module';
import { SistemasComponent } from './sistemas.component';

import { NbCardModule, NbInputModule, NbButtonModule, NbCheckboxModule, NbSelectModule, NbIconModule, NbActionsModule, NbTabsetModule, NbRouteTabsetModule, NbAlertModule, NbBadgeModule, NbDialogModule, NbSpinnerModule } from '@nebular/theme';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EntradasComponent } from './entradas/entradas.component';
import { OfertasComponent } from './ofertas/ofertas.component';
import { OfertasAddComponent } from './ofertas/tabs/ofertas-add.component';
import { OfertasActivasComponent } from './ofertas/tabs/ofertas-activas.component';
import { OfertasBuscarComponent } from './ofertas/tabs/ofertas-buscar.component';
import { OfertasHistoricoComponent } from './ofertas/tabs/ofertas-historico.component';
import { OfertasReporteComponent } from './ofertas/tabs/ofertas-reporte.component';
import { OfertasPorcentajeComponent } from './ofertas-porcentaje/ofertas-porcentaje.component';
import { SolicitudEtiquetsComponent } from './solicitud-de-etiquets/solicitud-de-etiquets.component';
import { SolicitudEtiquetsListaComponent } from './solicitud-de-etiquets/lista/solicitud-de-etiquets-lista.component';
import { DeptoBasculasComponent } from './depto-basculas/depto-basculas.component';

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
    NbTabsetModule,
    NbRouteTabsetModule,
    NbAlertModule,
    NbBadgeModule,
    NbSpinnerModule,
    NbDialogModule.forChild(),
    FormsModule,
  ],
  declarations: [
    SistemasComponent,
    EntradasComponent,
    OfertasComponent,
    OfertasBuscarComponent,
    OfertasHistoricoComponent,
    OfertasReporteComponent,
    OfertasPorcentajeComponent,
    SolicitudEtiquetsComponent,
    SolicitudEtiquetsListaComponent,
    DeptoBasculasComponent,
  ],
})
export class SistemasModule { }
