import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DepartamentosService } from '../../catalogos/departamentos/departamentos.service';
import { FamiliasService } from '../../catalogos/familias/familias.service';
import { ExistenciaHoyItem, TraspasosService } from '../traspasos/traspasos.service';

interface SeleccionOption {
  value: string;
  label: string;
}

interface FiltroFormValue {
  departamento: string;
  familia: string;
  codigo: string;
}

type SortColumn = 'Codigo' | 'Descripcion' | 'Departamento' | 'Familia' | 'UnidadMedida' | 'Cantidad' | 'TotalEntradas' | 'TotalSalidas' | 'ExistenciaHoy';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-historico-existencias',
  templateUrl: './historico-existencias.component.html',
  styleUrls: ['./historico-existencias.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoExistenciasComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  departamentos: SeleccionOption[] = [];
  familias: SeleccionOption[] = [];

  readonly filtroForm = this.fb.group({
    departamento: this.fb.control('0'),
    familia: this.fb.control('0'),
    codigo: this.fb.control(''),
  });

  items: ExistenciaHoyItem[] = [];
  displayItems: ExistenciaHoyItem[] = [];
  paginatedItems: ExistenciaHoyItem[] = [];

  cargando = false;
  departamentosLoading = false;
  departamentosError = '';
  familiasLoading = false;
  familiasError = '';
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Codigo';
  sortDirection: SortDirection = 'asc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly departamentosService: DepartamentosService,
    private readonly familiasService: FamiliasService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.suscribirCambiosDepartamento();
    this.cargarDepartamentos();
  }

  onBuscar(): void {
    this.error = '';

    const { departamento, familia, codigo } = this.filtroForm.getRawValue() as FiltroFormValue;

    this.cargando = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;
    this.markForCheck();

    this.traspasosService.obtenerExistenciaHoy(familia, departamento, codigo || null).subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener las existencias.';
        this.cargando = false;
        this.markForCheck();
      },
    });
  }

  retry(): void {
    this.onBuscar();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyTransforms();
    this.markForCheck();
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
    this.markForCheck();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '^' : 'v';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.paginate();
    this.markForCheck();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.paginate();
    this.markForCheck();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.paginate();
    this.markForCheck();
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
      Codigo: item.Codigo,
      Descripcion: item.Descripcion,
      Departamento: item.Departamento,
      Familia: item.Familia,
      'Unidad de medida': item.UnidadMedida,
      Inicial: item.Cantidad,
      Entradas: item.TotalEntradas,
      Salidas: item.TotalSalidas,
      'Existencia hoy': item.ExistenciaHoy,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExistenciaHoy');
    XLSX.writeFile(workbook, 'existencia-hoy-filtros.xlsx');
  }

  trackByCodigo(_: number, item: ExistenciaHoyItem): string {
    return `${item.Codigo}-${item.Departamento}-${item.Familia}`;
  }

  private cargarDepartamentos(): void {
    this.departamentosLoading = true;
    this.departamentosError = '';
    this.departamentos = [];
    this.markForCheck();

    this.departamentosService.fetchDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = (data || []).map((item) => ({
          value: String(item.Id),
          label: item.Nombre || `Departamento #${item.Id}`,
        }));
        this.departamentos = [{ value: '0', label: 'Ninguno' }, ...this.departamentos];
        this.filtroForm.patchValue({ departamento: '0' });
        this.departamentosLoading = false;
        this.markForCheck();
      },
      error: (error) => {
        this.departamentosLoading = false;
        this.departamentosError = error?.message || 'No se pudo cargar el catalogo de departamentos.';
        this.markForCheck();
      },
    });
  }

  private suscribirCambiosDepartamento(): void {
    this.filtroForm.get('departamento')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const idDepartamento = String(value || '').trim();
        this.cargarFamilias(idDepartamento);
      });
  }

  private cargarFamilias(idDepartamento: string): void {
    this.familiasLoading = true;
    this.familiasError = '';
    this.familias = [{ value: '0', label: 'Ninguno' }];
    this.filtroForm.patchValue({ familia: '0' }, { emitEvent: false });
    this.markForCheck();

    if (!idDepartamento || idDepartamento === '0') {
      this.familiasLoading = false;
      this.markForCheck();
      return;
    }

    this.familiasService.fetchFamilias(idDepartamento).subscribe({
      next: (data) => {
        this.familias = (data || []).map((item) => ({
          value: String(item.Id),
          label: item.Nombre || `Familia #${item.Id}`,
        }));
        this.familias = [{ value: '0', label: 'Ninguno' }, ...this.familias];
        this.filtroForm.patchValue({ familia: '0' }, { emitEvent: false });
        this.familiasLoading = false;
        this.markForCheck();
      },
      error: (error) => {
        this.familiasLoading = false;
        this.familiasError = error?.message || 'No se pudo cargar el catalogo de familias.';
        this.markForCheck();
      },
    });
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) => this.matchesSearch(item, term))
      : [...this.items];
    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private matchesSearch(item: ExistenciaHoyItem, term: string): boolean {
    return (item.Codigo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || (item.Familia || '').toLowerCase().includes(term)
      || (item.Departamento || '').toLowerCase().includes(term)
      || (item.UnidadMedida || '').toLowerCase().includes(term)
      || String(item.Cantidad).toLowerCase().includes(term)
      || String(item.TotalEntradas).toLowerCase().includes(term)
      || String(item.TotalSalidas).toLowerCase().includes(term)
      || String(item.ExistenciaHoy).toLowerCase().includes(term);
  }

  private compareRows(a: ExistenciaHoyItem, b: ExistenciaHoyItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Cantidad':
        result = Number(a.Cantidad) - Number(b.Cantidad);
        break;
      case 'TotalEntradas':
        result = Number(a.TotalEntradas) - Number(b.TotalEntradas);
        break;
      case 'TotalSalidas':
        result = Number(a.TotalSalidas) - Number(b.TotalSalidas);
        break;
      case 'ExistenciaHoy':
        result = Number(a.ExistenciaHoy) - Number(b.ExistenciaHoy);
        break;
      case 'Codigo':
      case 'Descripcion':
      case 'Familia':
      case 'Departamento':
      case 'UnidadMedida':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
