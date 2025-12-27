import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbAlertModule, NbBadgeModule, NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { CatalogosRoutingModule } from './catalogos-routing.module';
import { CatalogosComponent } from './catalogos.component';
import { DepartamentosComponent } from './departamentos/departamentos.component';
import { FamiliasComponent } from './familias/familias.component';
import { MedicosComponent } from './medicos/medicos.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ThemeModule,
    CatalogosRoutingModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbInputModule,
    NbSelectModule,
    NbSpinnerModule,
    NbAlertModule,
    NbBadgeModule,
  ],
  declarations: [CatalogosComponent, DepartamentosComponent, FamiliasComponent, MedicosComponent],
})
export class CatalogosModule {}
