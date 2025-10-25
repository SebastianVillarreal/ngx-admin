import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NbToastrService } from '@nebular/theme';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface PagoSpeiRow {
  numero: string; // número de pago
  proveedor: string;
  total: number;
  sucursal: string;
  folio: string;
  referenciaBanco: string;
  fecha: string; // YYYY-MM-DD
}

interface ApiPagoItem {
  Id: number;
  Consecutivo: string;
  Sucursal: string;
  Proveedor: string;
  Fecha: string; // dd/MM/yyyy
  ReferenciaBanco: string;
  Total: number;
  FolioStr: string;
}

interface ApiPagosResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response: { data: ApiPagoItem[] };
}

@Component({
  selector: 'ngx-pagos-spei-list',
  templateUrl: './pagos-spei-list.component.html',
  styleUrls: ['./pagos-spei-list.component.scss'],
})
export class PagosSpeiListComponent implements OnInit {
  form: FormGroup;

  // Datos cargados del API
  rows: PagoSpeiRow[] = [];

  // Estado UI
  page = 1;
  pageSize = 10;
  readonly pageSizes = [10, 25, 50, 100];
  sortColumn: keyof PagoSpeiRow | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  search = '';
  loading = false;
  private idSucursalDefault = 1;

  constructor(private fb: FormBuilder, private http: HttpClient, private toastr: NbToastrService) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Intenta obtener IdSucursal del usuario autenticado
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        this.idSucursalDefault = Number(u?.IdSucursal) || 1;
      }
    } catch {}

    this.form = this.fb.group({
      fechaInicial: [first],
      fechaFinal: [last],
    });
  }

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    const { fechaInicial, fechaFinal } = this.form.getRawValue();
    const params = new HttpParams()
      .set('id_sucursal', String(this.idSucursalDefault))
      .set('fecha_inicial', this.formatDate(fechaInicial) || '')
      // nombre de parámetro según ejemplo del servicio proporcionado
      .set('fecha_finaL', this.formatDate(fechaFinal) || '');

    this.loading = true;
    this.http
      .get<ApiPagosResponse>(`${environment.apiBase}/GetPagosSpei`, { params })
      .subscribe({
        next: (res) => {
          const items = res?.response?.data ?? [];
          this.rows = items.map((i) => ({
            numero: String(i.Consecutivo || ''),
            proveedor: String(i.Proveedor || ''),
            total: Number(i.Total) || 0,
            sucursal: String(i.Sucursal || ''),
            folio: String(i.FolioStr || ''),
            referenciaBanco: String(i.ReferenciaBanco || ''),
            fecha: this.fromDDMMYYYY(String(i.Fecha || '')),
          }));
          this.page = 1;
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al consultar pagos';
          this.toastr.danger(msg, 'Pagos SPEI');
        },
        complete: () => (this.loading = false),
      });
  }

  private formatDate(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private fromDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return dateStr;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  exportExcel(): void {
    // Export simple CSV para cumplir con "Exportar a Excel"
    const header = ['Número', 'Proveedor', 'Total', 'Sucursal', 'Folio', 'Referencia Banco', 'Fecha'];
    const rows = this.filteredRows.map(r => [r.numero, r.proveedor, r.total, r.sucursal, r.folio, r.referenciaBanco, r.fecha]);
    const csv = [header, ...rows].map(line => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pagos-spei.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  setSort(c: keyof PagoSpeiRow): void {
    if (this.sortColumn === c) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = c;
      this.sortDirection = 'asc';
    }
  }

  private compare(a: any, b: any): number {
    const d = (v: any) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? Date.parse(v) : v;
    const A = d(a), B = d(b);
    if (A < B) return -1; if (A > B) return 1; return 0;
  }

  get filteredRows(): PagoSpeiRow[] {
    const q = this.search?.toLowerCase() || '';
    return this.rows.filter(r => (
      r.numero.includes(q) ||
      r.proveedor.toLowerCase().includes(q) ||
      r.folio.toLowerCase().includes(q) ||
      r.referenciaBanco.toLowerCase().includes(q)
    ));
  }

  get sortedRows(): PagoSpeiRow[] {
    const arr = [...this.filteredRows];
    if (!this.sortColumn) return arr;
    return arr.sort((a, b) => {
      const res = this.compare(a[this.sortColumn], b[this.sortColumn]);
      return this.sortDirection === 'asc' ? res : -res;
    });
  }

  get pageRows(): PagoSpeiRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sortedRows.slice(start, start + this.pageSize);
  }

  get totalCount(): number { return this.filteredRows.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }
  get displayedCount(): number { return this.pageRows.length; }
  gotoPage(p: number): void { this.page = Math.min(Math.max(1, p), this.totalPages); }

  editar(r: PagoSpeiRow) { this.toastr.info(`Editar ${r.numero}`); }
  detalle(r: PagoSpeiRow) { this.toastr.info(`Detalle ${r.numero}`); }
  comprobante(r: PagoSpeiRow) { this.toastr.success(`Comprobante ${r.numero}`); }
  eliminar(r: PagoSpeiRow) { this.toastr.warning(`Eliminar ${r.numero}`); }
}
