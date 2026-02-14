import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface ApiPagoFechaItem {
  Id: number;
  Total: number;
  Serie: string;
  Sucursal: string;
  NombreProveedor: string;
  strTipo: string;
}

interface ApiPagoFechaResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response: { data: ApiPagoFechaItem[] };
}

interface VerificadorPagoRow {
  id: number;
  total: number;
  serie: string;
  sucursal: string;
  nombreProveedor: string;
  tipo: string;
}

@Component({
  selector: 'ngx-verificador-pagos-cxp',
  templateUrl: './verificador-pagos.component.html',
  styleUrls: ['./verificador-pagos.component.scss'],
})
export class VerificadorPagosComponent implements OnInit {
  form: FormGroup;

  // Fuente y arreglos derivados
  items: VerificadorPagoRow[] = [];
  displayItems: VerificadorPagoRow[] = [];
  paginatedItems: VerificadorPagoRow[] = [];

  // Tabla
  search = '';
  sortColumn: keyof VerificadorPagoRow | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;
  readonly pageSizes = [10, 25, 50, 100, -1];

  // Estados
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
      .get<ApiPagoFechaResponse>(`${environment.apiBase}/GetPagosFecha`, { params })
      .subscribe({
        next: (res) => {
          const rows = res?.response?.data ?? [];
          this.items = rows.map((r) => ({
            id: Number(r.Id) || 0,
            total: Number(r.Total) || 0,
            serie: String(r.Serie || ''),
            sucursal: String(r.Sucursal || ''),
            nombreProveedor: String(r.NombreProveedor || ''),
            tipo: String(r.strTipo || ''),
          }));
          this.page = 1;
          this.applyFiltersAndSorting();
        },
        error: (err) => {
          this.items = [];
          this.displayItems = [];
          this.paginatedItems = [];
          this.errorMessage = err?.error?.message || err?.message || 'Error al cargar pagos.';
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

  setSort(column: keyof VerificadorPagoRow): void {
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
    const header = ['Id', 'Total', 'Serie', 'Sucursal', 'Nombre Proveedor', 'Tipo'];
    const rows = this.displayItems.map((r) => [
      r.id,
      r.total,
      this.escapeCsv(r.serie),
      this.escapeCsv(r.sucursal),
      this.escapeCsv(r.nombreProveedor),
      this.escapeCsv(r.tipo),
    ]);
    const csv = [header, ...rows].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verificador-pagos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  trackById(_index: number, item: VerificadorPagoRow): number {
    return item.id;
  }

  get totalCount(): number {
    return this.displayItems.length;
  }

  get totalPages(): number {
    if (this.pageSize === -1) return 1;
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get displayedCount(): number {
    return this.paginatedItems.length;
  }

  get startIndex(): number {
    if (this.totalCount === 0) return 0;
    return this.pageSize === -1 ? 1 : (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    if (this.totalCount === 0) return 0;
    if (this.pageSize === -1) return this.totalCount;
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  private applyFiltersAndSorting(): void {
    const q = this.search.trim().toLowerCase();
    const filtered = this.items.filter((r) => {
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        String(r.total).includes(q) ||
        r.serie.toLowerCase().includes(q) ||
        r.sucursal.toLowerCase().includes(q) ||
        r.nombreProveedor.toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q)
      );
    });

    this.displayItems = [...filtered];

    if (this.sortColumn) {
      this.displayItems.sort((a, b) => {
        const result = this.compare(a[this.sortColumn as keyof VerificadorPagoRow], b[this.sortColumn as keyof VerificadorPagoRow]);
        return this.sortDirection === 'asc' ? result : -result;
      });
    }

    this.applyPagination();
  }

  private applyPagination(): void {
    if (this.pageSize === -1) {
      this.paginatedItems = [...this.displayItems];
      return;
    }
    const start = (this.page - 1) * this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, start + this.pageSize);
  }

  private compare(a: string | number, b: string | number): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  private formatDate(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private escapeCsv(value: string): string {
    if (!value) return '';
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}
