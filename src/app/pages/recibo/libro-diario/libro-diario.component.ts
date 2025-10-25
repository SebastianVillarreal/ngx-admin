import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { formatDate } from '@angular/common';

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

// Full API record (we keep all fields but only display selected columns)
interface LibroEntradaApiRecord {
  Id: number;
  IdProveedor: number;
  ClaveProveedor: string;
  Proveedor: string;
  Factura: string;
  NumeroNota: string;
  Total: number;
  Observaciones: string | null;
  Ordencompra: number;
  ComentarioCancela: string | null;
  Autorizado: number;
  Suma: number;
  Inicio: string;
  Final: string;
  TotalTime: string;
  Tipo: number;
  IdSucursal: number;
  NombreSucursal: string;
  FechaRecibo: string;
  Carta: number;
  Plazo: string | null;
  Recibe: string | null;
  Huella: string | null;
  IdEntrada: number;
  FechaVencimiento: string | null;
  RetencionTasa: number;
  RetencionIva: number;
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

  // Keep the raw API data for future needs; map to rows for display
  data: LibroEntradaApiRecord[] = [];
  rows: LibroDiarioRow[] = [];

  // Pagination state
  currentPage = 1; // 1-based index

  get filteredRows(): LibroDiarioRow[] {
    const s = (this.search || '').toLowerCase().trim();
    if (!s) return this.rows;
    return this.rows.filter((r) =>
      (
        r.folio + ' ' + r.proveedor + ' ' + r.factura + ' ' + r.obsrv + ' ' + r.suc
      )
        .toLowerCase()
        .includes(s),
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get pagedRows(): LibroDiarioRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
  }

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.filtrosForm = this.fb.group({
      fechaInicial: [new Date()],
      fechaFinal: [new Date()],
      sucursal: [1],
    });
  }

  onBuscar() {
    const { fechaInicial, fechaFinal, sucursal } = this.filtrosForm.value;
    const start = formatDate(fechaInicial, 'yyyy-MM-dd', 'en-US');
    const end = formatDate(fechaFinal, 'yyyy-MM-dd', 'en-US');

    const params = new HttpParams()
      .set('fecha_inicial', start)
      .set('fecha_final', end)
      .set('sucursal', String(sucursal ?? 1));

    this.http
      .get<{ StatusCode: number; success: boolean; message: string; response: { data: LibroEntradaApiRecord[] } }>(
        '/api/GetLibroEntrada',
        { params },
      )
      .subscribe((res) => {
        const list = res?.response?.data || [];
        this.data = list;
        this.rows = list.map((r) => this.mapToRow(r));
        this.currentPage = 1; // reset to first page
        this.cdr.markForCheck();
      });
  }

  private mapToRow(r: LibroEntradaApiRecord): LibroDiarioRow {
    return {
      folio: r.NumeroNota,
      cf: 'CF', // No field provided; keep fixed as in design
      nota: 'Nota Cargo', // Not in payload; shown as label in UI
      proveedor: r.Proveedor,
      recibo: r.FechaRecibo,
      ordenCot: String(r.Ordencompra ?? ''),
      factura: r.Factura,
      total: r.Total,
      obsrv: (r.Observaciones ?? 'N/A') as string,
      suc: r.NombreSucursal,
    };
  }

  // Pagination helpers
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }
}
