import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';

interface ApiResumenPagoItem {
  IdSpei: number;
  NumeroSpei: string;
  FolioStr: string;
  ReferenciaBanco: string;
  Sucursal: string;
  Proveedor: string;
  IdProveedor: number;
  FechaPago: string;
  Total: number;
  NC: number;
  NotasAsignadas: number;
  Descuento: number;
  TotalPagar: number;
  Estatus: string;
}

interface ApiResumenPagosResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response: { data: ApiResumenPagoItem[] };
}

interface ResumenPagoRow {
  idSpei: number;
  numeroSpei: string;
  folio: string;
  referenciaBanco: string;
  sucursal: string;
  proveedor: string;
  idProveedor: number;
  fechaPago: string;
  total: number;
  nc: number;
  notasAsignadas: number;
  descuento: number;
  totalPagar: number;
  estatus: string;
}

type SortColumn =
  | 'idSpei'
  | 'numeroSpei'
  | 'folio'
  | 'referenciaBanco'
  | 'sucursal'
  | 'proveedor'
  | 'idProveedor'
  | 'fechaPago'
  | 'total'
  | 'nc'
  | 'notasAsignadas'
  | 'descuento'
  | 'totalPagar'
  | 'estatus';

@Component({
  selector: 'ngx-resumen-pagos-cxp',
  templateUrl: './resumen-pagos.component.html',
  styleUrls: ['./resumen-pagos.component.scss'],
})
export class ResumenPagosComponent implements OnInit {
  form: FormGroup;

  items: ResumenPagoRow[] = [];
  displayItems: ResumenPagoRow[] = [];
  paginatedItems: ResumenPagoRow[] = [];

  search = '';
  sortColumn: SortColumn = 'idSpei';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;
  readonly pageSizes = [10, 25, 50];

  loading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
      .set('fecha_inicial', this.formatDate(fechaInicial) || '')
      .set('fecha_final', this.formatDate(fechaFinal) || '');

    this.loading = true;
    this.errorMessage = '';
    this.http
      .get<ApiResumenPagosResponse>(`${environment.apiBase}/GetResumenPagosFechas`, { params })
      .subscribe({
        next: (res) => {
          const rows = res?.response?.data ?? [];
          this.items = rows.map((r) => ({
            idSpei: Number(r.IdSpei) || 0,
            numeroSpei: String(r.NumeroSpei || ''),
            folio: String(r.FolioStr || ''),
            referenciaBanco: String(r.ReferenciaBanco || ''),
            sucursal: String(r.Sucursal || ''),
            proveedor: String(r.Proveedor || ''),
            idProveedor: Number(r.IdProveedor) || 0,
            fechaPago: String(r.FechaPago || ''),
            total: Number(r.Total) || 0,
            nc: Number(r.NC) || 0,
            notasAsignadas: Number(r.NotasAsignadas) || 0,
            descuento: Number(r.Descuento) || 0,
            totalPagar: Number(r.TotalPagar) || 0,
            estatus: String(r.Estatus || ''),
          }));
          this.page = 1;
          this.applyFiltersAndSorting();
        },
        error: (err) => {
          this.items = [];
          this.displayItems = [];
          this.paginatedItems = [];
          this.errorMessage = err?.error?.message || err?.message || 'Error al cargar el resumen de pagos.';
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  retry(): void {
    this.buscar();
  }

  onSearchChange(): void {
    this.page = 1;
    this.applyFiltersAndSorting();
  }

  setSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  setPageSize(size: number): void {
    this.pageSize = Number(size);
    this.page = 1;
    this.applyPagination();
  }

  gotoPage(page: number): void {
    this.page = Math.min(Math.max(1, page), this.totalPages);
    this.applyPagination();
  }

  exportExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      IdSpei: item.idSpei,
      NumeroSpei: item.numeroSpei,
      Folio: item.folio,
      ReferenciaBanco: item.referenciaBanco,
      Sucursal: item.sucursal,
      Proveedor: item.proveedor,
      IdProveedor: item.idProveedor,
      FechaPago: item.fechaPago,
      Total: item.total,
      NC: item.nc,
      NotasAsignadas: item.notasAsignadas,
      Descuento: item.descuento,
      TotalPagar: item.totalPagar,
      Estatus: item.estatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ResumenPagos');
    XLSX.writeFile(workbook, 'resumen-pagos.xlsx');
  }

  trackById(_index: number, item: ResumenPagoRow): number {
    return item.idSpei;
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  get totalCount(): number {
    return this.displayItems.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get displayedCount(): number {
    return this.paginatedItems.length;
  }

  get startIndex(): number {
    if (this.totalCount === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    if (this.totalCount === 0) return 0;
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  private applyFiltersAndSorting(): void {
    const q = this.search.trim().toLowerCase();
    const filtered = this.items.filter((r) => {
      if (!q) return true;
      return (
        String(r.idSpei).includes(q) ||
        r.numeroSpei.toLowerCase().includes(q) ||
        r.folio.toLowerCase().includes(q) ||
        r.referenciaBanco.toLowerCase().includes(q) ||
        r.sucursal.toLowerCase().includes(q) ||
        r.proveedor.toLowerCase().includes(q) ||
        String(r.idProveedor).includes(q) ||
        r.fechaPago.toLowerCase().includes(q) ||
        String(r.total).includes(q) ||
        String(r.nc).includes(q) ||
        String(r.notasAsignadas).includes(q) ||
        String(r.descuento).includes(q) ||
        String(r.totalPagar).includes(q) ||
        r.estatus.toLowerCase().includes(q)
      );
    });

    this.displayItems = [...filtered];

    const column = this.sortColumn;
    this.displayItems.sort((a, b) => {
      const result = this.compare(
        a[column],
        b[column],
        column,
      );
      return this.sortDirection === 'asc' ? result : -result;
    });

    this.applyPagination();
  }

  private applyPagination(): void {
    const start = (this.page - 1) * this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, start + this.pageSize);
  }

  private compare(
    a: string | number,
    b: string | number,
    column: keyof ResumenPagoRow,
  ): number {
    if (column === 'fechaPago') {
      const ta = this.toTimestamp(String(a || ''));
      const tb = this.toTimestamp(String(b || ''));
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return 0;
    }

    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    const sa = typeof a === 'string' ? a.toLowerCase() : a;
    const sb = typeof b === 'string' ? b.toLowerCase() : b;

    if (sa < sb) return -1;
    if (sa > sb) return 1;
    return 0;
  }

  private toTimestamp(value: string): number {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return 0;
    const [, dd, mm, yyyy] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
  }

  private formatDate(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
