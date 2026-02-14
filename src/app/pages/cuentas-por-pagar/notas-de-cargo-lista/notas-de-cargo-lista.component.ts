import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface ApiProveedorItem {
  Id: number;
  nombre?: string;
  Nombre?: string;
}

interface ApiProveedoresResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: { data?: ApiProveedorItem[] };
}

interface ApiNotaCargoItem {
  Id: number;
  NombreProveedor: string;
  NombreSucursal: string;
  IdRemision: number;
  Subtotal: number;
  Ieps: number;
  Iva: number;
  Total: number;
  Fecha: string;
}

interface ApiNotasCargoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: { data?: ApiNotaCargoItem[] };
}

interface ProveedorOption {
  id: number;
  nombre: string;
}

interface NotaCargoRow {
  id: number;
  proveedor: string;
  sucursal: string;
  remision: string;
  subtotal: number;
  ieps: number;
  iva: number;
  total: number;
  fecha: string;
}

@Component({
  selector: 'ngx-notas-de-cargo-lista',
  templateUrl: './notas-de-cargo-lista.component.html',
  styleUrls: ['./notas-de-cargo-lista.component.scss'],
})
export class NotasDeCargoListaComponent implements OnInit {
  form: FormGroup;
  proveedores: ProveedorOption[] = [];
  loadingProveedores = false;

  items: NotaCargoRow[] = [];
  displayItems: NotaCargoRow[] = [];
  paginatedItems: NotaCargoRow[] = [];

  searchTerm = '';
  sortColumn: keyof NotaCargoRow | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 25, 50, 100];

  loading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    let idSucursal = 1;
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        idSucursal = Number(u?.IdSucursal) || 1;
      }
    } catch {}

    this.form = this.fb.group({
      idSucursal: [idSucursal],
      idProveedor: [null],
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.loadingProveedores = true;
    this.http.post<ApiProveedoresResponse>(`${environment.apiBase}/GetProveedores`, {}).subscribe({
      next: (res) => {
        const raw = res?.response?.data ?? [];
        this.proveedores = raw
          .map((p) => ({
            id: Number(p.Id) || 0,
            nombre: String(p.nombre || p.Nombre || ''),
          }))
          .filter((p) => p.id > 0);

        if (!this.form.controls.idProveedor.value && this.proveedores.length > 0) {
          this.form.controls.idProveedor.setValue(this.proveedores[0].id);
        }
        this.buscar();
      },
      error: () => {
        this.proveedores = [];
        this.buscar();
      },
      complete: () => {
        this.loadingProveedores = false;
      },
    });
  }

  buscar(): void {
    const { idSucursal, idProveedor } = this.form.getRawValue();
    const body = {
      IdSucursal: String(idSucursal ?? 1),
      IdProveedor: String(idProveedor ?? ''),
      pagos: '0',
    };

    this.loading = true;
    this.errorMessage = '';
    this.http.post<ApiNotasCargoResponse>(`${environment.apiBase}/GetNotasCreditoProveedor`, body).subscribe({
      next: (res) => {
        const rows = res?.response?.data ?? [];
        this.items = rows.map((r) => ({
          id: Number(r.Id) || 0,
          proveedor: String(r.NombreProveedor || ''),
          sucursal: String(r.NombreSucursal || ''),
          remision: String(r.IdRemision || ''),
          subtotal: Number(r.Subtotal) || 0,
          ieps: Number(r.Ieps) || 0,
          iva: Number(r.Iva) || 0,
          total: Number(r.Total) || 0,
          fecha: this.fromDDMMYYYY(String(r.Fecha || '')),
        }));
        this.page = 1;
        this.applyFiltersAndSorting();
      },
      error: (err) => {
        this.items = [];
        this.displayItems = [];
        this.paginatedItems = [];
        this.errorMessage = err?.error?.message || err?.message || 'Error al cargar notas de cargo.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  retry(): void {
    this.buscar();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.page = 1;
    this.applyFiltersAndSorting();
  }

  onRefresh(): void {
    this.buscar();
  }

  setSort(column: keyof NotaCargoRow): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.page = 1;
    this.applyPagination();
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.applyPagination();
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyPagination();
    }
  }

  exportExcel(): void {
    const header = ['Id', 'Proveedor', 'Sucursal', 'Remision', 'Subtotal', 'Ieps', 'Iva', 'Total', 'Fecha'];
    const rows = this.displayItems.map((r) => [
      r.id,
      this.escapeCsv(r.proveedor),
      this.escapeCsv(r.sucursal),
      this.escapeCsv(r.remision),
      r.subtotal,
      r.ieps,
      r.iva,
      r.total,
      this.escapeCsv(r.fecha),
    ]);
    const csv = [header, ...rows].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notas-de-cargo.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  trackById(_index: number, item: NotaCargoRow): number {
    return item.id;
  }

  get totalCount(): number {
    return this.displayItems.length;
  }

  get totalPages(): number {
    if (this.pageSize === -1) return 1;
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get rangeStart(): number {
    if (this.totalCount === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    if (this.totalCount === 0) return 0;
    return Math.min(this.page * this.pageSize, this.totalCount);
  }

  private applyFiltersAndSorting(): void {
    const q = this.searchTerm.trim().toLowerCase();
    const filtered = this.items.filter((r) => {
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        r.proveedor.toLowerCase().includes(q) ||
        r.sucursal.toLowerCase().includes(q) ||
        r.remision.toLowerCase().includes(q) ||
        String(r.subtotal).includes(q) ||
        String(r.ieps).includes(q) ||
        String(r.iva).includes(q) ||
        String(r.total).includes(q) ||
        r.fecha.toLowerCase().includes(q)
      );
    });

    this.displayItems = [...filtered];
    if (this.sortColumn) {
      this.displayItems.sort((a, b) => {
        const result = this.compare(a[this.sortColumn as keyof NotaCargoRow], b[this.sortColumn as keyof NotaCargoRow]);
        return this.sortDirection === 'asc' ? result : -result;
      });
    }
    this.applyPagination();
  }

  private applyPagination(): void {
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

  private fromDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return dateStr;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  private escapeCsv(value: string): string {
    if (!value) return '';
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}
