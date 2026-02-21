import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

import { InventariosService, MovimientoTipoItem, MovimientosTipoPayload } from '../../inventarios.service';

type SortColumn =
  | 'Id'
  | 'Sucursal'
  | 'TipoMovimeinto'
  | 'Folio'
  | 'Estatus'
  | 'FechaCreacion'
  | 'FechaAutorizacion'
  | 'FechaAfectacion'
  | 'ClaveProveedor'
  | 'Referencia'
  | 'UsuarioAutoriza'
  | 'Comentarios';
type SortDirection = 'asc' | 'desc';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-reporte-movimientos',
  templateUrl: './reporte-movimientos.component.html',
  styleUrls: ['./reporte-movimientos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteMovimientosComponent {
  readonly sucursales: SelectOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly filtrosForm = this.fb.group({
    IdSucursal: ['1', Validators.required],
    Tipo: ['', Validators.required],
    Fecha: ['', Validators.required],
    FechaFin: ['', Validators.required],
  });

  tiposMovimiento: SelectOption[] = [];
  tiposLoading = false;
  tiposError = '';

  loading = false;
  error = '';
  searchTerm = '';

  items: MovimientoTipoItem[] = [];
  displayItems: MovimientoTipoItem[] = [];
  paginatedItems: MovimientoTipoItem[] = [];

  sortColumn: SortColumn = 'FechaCreacion';
  sortDirection: SortDirection = 'desc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const today = this.getToday();
    this.filtrosForm.patchValue({
      Fecha: today,
      FechaFin: today,
    });

    this.cargarTiposMovimiento();
  }

  buscar(): void {
    this.error = '';

    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      return;
    }

    const payload = this.filtrosForm.getRawValue() as MovimientosTipoPayload;
    if (payload.FechaFin < payload.Fecha) {
      this.error = 'La fecha final debe ser mayor o igual a la fecha inicial.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;
    this.searchTerm = '';

    this.inventariosService.fetchMovimientosTipo(payload).subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo consultar el reporte de movimientos.';
        this.cdr.markForCheck();
      },
    });
  }

  retry(): void {
    this.buscar();
  }

  retryTipos(): void {
    this.cargarTiposMovimiento();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyTransforms();
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyTransforms();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.paginate();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.paginate();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.paginate();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayItems.length / this.pageSize));
  }

  get pageStart(): number {
    if (!this.displayItems.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (!this.displayItems.length) {
      return 0;
    }
    return Math.min(this.currentPage * this.pageSize, this.displayItems.length);
  }

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      Id: item.Id,
      Sucursal: item.Sucursal,
      TipoMovimiento: item.TipoMovimeinto,
      Folio: item.Folio,
      Estatus: item.Estatus,
      FechaCreacion: item.FechaCreacion,
      FechaAutorizacion: item.FechaAutorizacion,
      FechaAfectacion: item.FechaAfectacion,
      ClaveProveedor: item.ClaveProveedor,
      Referencia: item.Referencia,
      UsuarioAutoriza: item.UsuarioAutoriza,
      Comentarios: item.Comentarios,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ReporteMovimientos');
    XLSX.writeFile(workbook, 'reporte-movimientos.xlsx');
  }

  trackById(_: number, item: MovimientoTipoItem): number {
    return item.Id;
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) => this.matchesTerm(item, term))
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
    this.cdr.markForCheck();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
    this.cdr.markForCheck();
  }

  private matchesTerm(item: MovimientoTipoItem, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || (item.Sucursal || '').toLowerCase().includes(term)
      || (item.TipoMovimeinto || '').toLowerCase().includes(term)
      || String(item.Folio).toLowerCase().includes(term)
      || (item.Estatus || '').toLowerCase().includes(term)
      || (item.FechaCreacion || '').toLowerCase().includes(term)
      || (item.FechaAutorizacion || '').toLowerCase().includes(term)
      || (item.FechaAfectacion || '').toLowerCase().includes(term)
      || (item.ClaveProveedor || '').toLowerCase().includes(term)
      || (item.Referencia || '').toLowerCase().includes(term)
      || (item.UsuarioAutoriza || '').toLowerCase().includes(term)
      || (item.Comentarios || '').toLowerCase().includes(term);
  }

  private compareRows(a: MovimientoTipoItem, b: MovimientoTipoItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Id':
      case 'Folio':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Sucursal':
      case 'TipoMovimeinto':
      case 'Estatus':
      case 'FechaCreacion':
      case 'FechaAutorizacion':
      case 'FechaAfectacion':
      case 'ClaveProveedor':
      case 'Referencia':
      case 'UsuarioAutoriza':
      case 'Comentarios':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private getToday(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private cargarTiposMovimiento(): void {
    this.tiposLoading = true;
    this.tiposError = '';
    this.tiposMovimiento = [];

    this.inventariosService.fetchTipoMovimientos('0').subscribe({
      next: (items) => {
        this.tiposMovimiento = (items || []).map((item) => ({
          value: item.Clave,
          label: item.Nombre,
        }));

        const selected = this.filtrosForm.get('Tipo')?.value;
        const exists = this.tiposMovimiento.some((item) => item.value === selected);
        if (!exists) {
          this.filtrosForm.patchValue({ Tipo: this.tiposMovimiento[0]?.value ?? '' });
        }

        this.tiposLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.tiposLoading = false;
        this.tiposError = error.message || 'No se pudieron cargar los tipos de movimiento.';
        this.cdr.markForCheck();
      },
    });
  }
}
