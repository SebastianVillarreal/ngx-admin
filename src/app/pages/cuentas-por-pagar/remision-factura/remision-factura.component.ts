import { HttpClient } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { environment } from '../../../../environments/environment';

interface ApiEntradaFacturaItem {
  Id: number;
  Factura: string;
  Nota: string;
  Total: number;
  IdProveedor: number;
  NombreProveedor: string;
}

interface ApiEntradaFacturaResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response: { data: ApiEntradaFacturaItem[] };
}

interface ApiCorregirRemisionResponse {
  StatusCode: number;
  success: boolean;
  message: string;
}

interface ProveedorOption {
  id: number;
  nombre: string;
}

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

interface RemisionFacturaRow {
  id: number;
  factura: string;
  nota: string;
  total: number;
  idProveedor: number;
  nombreProveedor: string;
}

@Component({
  selector: 'ngx-remision-factura-cxp',
  templateUrl: './remision-factura.component.html',
  styleUrls: ['./remision-factura.component.scss'],
})
export class RemisionFacturaComponent implements OnInit {
  @ViewChild('editarFacturaDialog') editarFacturaDialog!: TemplateRef<any>;

  form: FormGroup;
  editForm: FormGroup;
  dialogRef: NbDialogRef<any> | null = null;
  selectedRow: RemisionFacturaRow | null = null;

  // Convencion de tabla: fuente y derivados
  items: RemisionFacturaRow[] = [];
  displayItems: RemisionFacturaRow[] = [];
  paginatedItems: RemisionFacturaRow[] = [];

  search = '';
  sortColumn: keyof RemisionFacturaRow | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;
  readonly pageSizes = [10, 25, 50, 100, -1];

  loading = false;
  loadingProveedores = false;
  saving = false;
  errorMessage = '';
  saveErrorMessage = '';
  proveedores: ProveedorOption[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogService: NbDialogService,
    private toastr: NbToastrService,
  ) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
      fechaInicial: [first],
      fechaFinal: [last],
    });

    this.editForm = this.fb.group({
      factura: [''],
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
        this.proveedores = raw.map((p) => ({
          id: Number(p.Id) || 0,
          nombre: String(p.nombre || p.Nombre || ''),
        })).filter((p) => p.id > 0);

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
    const { idSucursal, idProveedor, fechaInicial, fechaFinal } = this.form.getRawValue();
    const body = {
      IdSucursal: String(idSucursal ?? 1),
      IdProveedor: String(idProveedor ?? ''),
      FechaInicial: this.formatDate(fechaInicial) || '',
      FechaFinal: this.formatDate(fechaFinal) || '',
    };

    this.loading = true;
    this.errorMessage = '';
    this.http
      .post<ApiEntradaFacturaResponse>(`${environment.apiBase}/GetEntradasFacturas`, body)
      .subscribe({
        next: (res) => {
          const rows = res?.response?.data ?? [];
          this.items = rows.map((r) => ({
            id: Number(r.Id) || 0,
            factura: String(r.Factura || ''),
            nota: String(r.Nota || ''),
            total: Number(r.Total) || 0,
            idProveedor: Number(r.IdProveedor) || 0,
            nombreProveedor: String(r.NombreProveedor || ''),
          }));
          this.page = 1;
          this.applyFiltersAndSorting();
        },
        error: (err) => {
          this.items = [];
          this.displayItems = [];
          this.paginatedItems = [];
          this.errorMessage = err?.error?.message || err?.message || 'Error al cargar datos.';
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  retry(): void {
    this.buscar();
  }

  openEditar(row: RemisionFacturaRow): void {
    this.selectedRow = row;
    this.saveErrorMessage = '';
    this.editForm.controls.factura.setValue(row.factura || '');
    this.dialogRef = this.dialogService.open(this.editarFacturaDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
    });
  }

  closeEditar(ref?: NbDialogRef<any>): void {
    (ref || this.dialogRef)?.close();
    this.dialogRef = null;
    this.selectedRow = null;
    this.saveErrorMessage = '';
    this.saving = false;
  }

  guardarCorreccion(ref?: NbDialogRef<any>): void {
    if (!this.selectedRow) return;
    const facturaNueva = String(this.editForm.controls.factura.value || '').trim();
    if (!facturaNueva) {
      this.saveErrorMessage = 'Factura es requerida.';
      return;
    }

    this.saving = true;
    this.saveErrorMessage = '';
    const body = {
      Factura: facturaNueva,
      Id: String(this.selectedRow.id),
    };

    this.http.post<ApiCorregirRemisionResponse>(`${environment.apiBase}/CorregirRemision`, body).subscribe({
      next: (res) => {
        const ok = Boolean(res?.success);
        if (!ok) {
          this.saveErrorMessage = res?.message || 'No se pudo actualizar la factura.';
          return;
        }
        this.toastr.success('Factura corregida correctamente.', 'Remision a factura');
        this.closeEditar(ref);
        this.buscar();
      },
      error: (err) => {
        this.saveErrorMessage = err?.error?.message || err?.message || 'Error al corregir factura.';
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  onSearchChange(): void {
    this.page = 1;
    this.applyFiltersAndSorting();
  }

  setSort(column: keyof RemisionFacturaRow): void {
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
    const header = ['Id', 'Factura', 'Nota', 'Total', 'IdProveedor', 'NombreProveedor'];
    const rows = this.displayItems.map((r) => [
      r.id,
      this.escapeCsv(r.factura),
      this.escapeCsv(r.nota),
      r.total,
      r.idProveedor,
      this.escapeCsv(r.nombreProveedor),
    ]);
    const csv = [header, ...rows].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remision-a-factura.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  trackById(_index: number, item: RemisionFacturaRow): number {
    return item.id;
  }

  get totalCount(): number {
    return this.displayItems.length;
  }

  get totalPages(): number {
    if (this.pageSize === -1) return 1;
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
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
        r.factura.toLowerCase().includes(q) ||
        r.nota.toLowerCase().includes(q) ||
        String(r.total).includes(q) ||
        String(r.idProveedor).includes(q) ||
        r.nombreProveedor.toLowerCase().includes(q)
      );
    });

    this.displayItems = [...filtered];

    if (this.sortColumn) {
      this.displayItems.sort((a, b) => {
        const result = this.compare(
          a[this.sortColumn as keyof RemisionFacturaRow],
          b[this.sortColumn as keyof RemisionFacturaRow],
        );
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
