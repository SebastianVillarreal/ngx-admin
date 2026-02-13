import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

import { DepartamentosService } from '../../catalogos/departamentos/departamentos.service';
import { FamiliasService } from '../../catalogos/familias/familias.service';
import { ExistenciaInventario, TraspasosService } from '../traspasos/traspasos.service';

interface SeleccionOption {
  value: string;
  label: string;
}

interface FiltroFormValue {
  departamento: string;
  familia: string;
  fecha: string;
}

type SortColumn = 'Fecha' | 'Codigo' | 'Descripcion' | 'Familia' | 'Departamento' | 'Cantidad';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-historico-existencias',
  templateUrl: './historico-existencias.component.html',
  styleUrls: ['./historico-existencias.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoExistenciasComponent implements OnInit {
  departamentos: SeleccionOption[] = [];
  familias: SeleccionOption[] = [];

  readonly filtroForm = this.fb.group({
    departamento: this.fb.control('', Validators.required),
    familia: this.fb.control('', Validators.required),
    fecha: this.fb.control('', Validators.required),
  });

  items: ExistenciaInventario[] = [];
  displayItems: ExistenciaInventario[] = [];
  paginatedItems: ExistenciaInventario[] = [];

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
    this.establecerFechaInicial();
    this.suscribirCambiosDepartamento();
    this.cargarDepartamentos();
  }

  onBuscar(): void {
    this.error = '';

    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.error = 'Completa el departamento, la familia y la fecha para continuar.';
      this.markForCheck();
      return;
    }

    const { departamento, familia, fecha } = this.filtroForm.value as FiltroFormValue;

    this.cargando = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;
    this.markForCheck();

    this.traspasosService.obtenerExistencias(familia, departamento, fecha).subscribe({
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
      Fecha: item.Fecha,
      Codigo: item.Codigo,
      Cantidad: item.Cantidad,
      Descripcion: item.Descripcion,
      Familia: item.Familia,
      Departamento: item.Departamento,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HistoricoExistencias');
    XLSX.writeFile(workbook, 'historico-existencias.xlsx');
  }

  trackByCodigo(_: number, item: ExistenciaInventario): string {
    return `${item.Codigo}-${item.Fecha}`;
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
        this.filtroForm.patchValue({ departamento: this.departamentos[0]?.value ?? '' });
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
    this.filtroForm.get('departamento')?.valueChanges.subscribe((value) => {
      const idDepartamento = String(value || '').trim();
      this.cargarFamilias(idDepartamento);
    });
  }

  private cargarFamilias(idDepartamento: string): void {
    this.familiasLoading = true;
    this.familiasError = '';
    this.familias = [];
    this.filtroForm.patchValue({ familia: '' }, { emitEvent: false });
    this.markForCheck();

    if (!idDepartamento) {
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
        this.filtroForm.patchValue({ familia: this.familias[0]?.value ?? '' }, { emitEvent: false });
        this.familiasLoading = false;
        this.markForCheck();
        this.onBuscar();
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

  private matchesSearch(item: ExistenciaInventario, term: string): boolean {
    return (item.Fecha || '').toLowerCase().includes(term)
      || (item.Codigo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || (item.Familia || '').toLowerCase().includes(term)
      || (item.Departamento || '').toLowerCase().includes(term)
      || String(item.Cantidad).toLowerCase().includes(term);
  }

  private compareRows(a: ExistenciaInventario, b: ExistenciaInventario): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Cantidad':
        result = Number(a.Cantidad) - Number(b.Cantidad);
        break;
      case 'Fecha':
        result = this.parseSlashDate(a.Fecha) - this.parseSlashDate(b.Fecha);
        break;
      case 'Codigo':
      case 'Descripcion':
      case 'Familia':
      case 'Departamento':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private parseSlashDate(value: string): number {
    const parts = (value || '').split('/');
    if (parts.length !== 3) {
      return 0;
    }
    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  private establecerFechaInicial(): void {
    const hoy = new Date();
    this.filtroForm.patchValue({
      fecha: this.formatearFecha(hoy),
    });
    this.markForCheck();
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}

