import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface LibroDiarioRow {
  folio: string;
  cf: string;
  nota: string;
  proveedor: string;
  recibo: string;
  ordenCot: string;
  factura: string;
  total: number;
  obsrv: string;
  suc: string;
}

@Component({
  selector: 'ngx-libro-diario',
  templateUrl: './libro-diario.component.html',
  styleUrls: ['./libro-diario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibroDiarioComponent {
  filtrosForm: FormGroup;

  pageSizeOptions = [10, 20, 50];
  pageSize = 10;
  search = '';

  rows: LibroDiarioRow[] = [
    {
      folio: '12510011',
      cf: 'CF',
      nota: 'Nota Cargo',
      proveedor: 'BOTANAS Y DERIVADOS, S.A DE C.V',
      recibo: '01/10/2025',
      ordenCot: '0',
      factura: '6217',
      total: 2687.68,
      obsrv: 'N/A',
      suc: 'Matriz',
    },
  ];

  constructor(private fb: FormBuilder) {
    this.filtrosForm = this.fb.group({
      fechaInicial: [new Date()],
      fechaFinal: [new Date()],
    });

    // Fill some mock rows for design purposes
    for (let i = 0; i < 9; i++) {
      this.rows.push({ ...this.rows[0], folio: (12510012 + i).toString(), factura: (6000 + i).toString(), total: Math.round((2000 + i * 500) * 100) / 100 });
    }
  }

  onBuscar() {
    // Design only: no-op for now
  }
}
