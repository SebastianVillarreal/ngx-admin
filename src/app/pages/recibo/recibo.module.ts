import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbFormFieldModule,
  NbButtonGroupModule,
} from '@nebular/theme';

import { ThemeModule } from '../../@theme/theme.module';
import { ReciboRoutingModule } from './recibo-routing.module';
import { ReciboComponent } from './recibo.component';
import { LibroDiarioComponent } from './libro-diario/libro-diario.component';

@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    ReciboRoutingModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    NbSelectModule,
    NbIconModule,
  NbActionsModule,
    NbDatepickerModule,
    NbFormFieldModule,
  NbButtonGroupModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [ReciboComponent, LibroDiarioComponent],
})
export class ReciboModule {}
