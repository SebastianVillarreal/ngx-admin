import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { ExistenciaNegativaItem, TraspasosService } from '../traspasos/traspasos.service';

type SortColumn = 'Codigo' | 'Descripcion' | 'Cantidad' | 'Existencia' | 'Departamento' | 'Familia';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-existencias-negativas',
  templateUrl: './existencias-negativas.component.html',
  styleUrls: ['./existencias-negativas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExistenciasNegativasComponent implements OnInit {
  items: ExistenciaNegativaItem[] = [];
  displayItems: ExistenciaNegativaItem[] = [];
  paginatedItems: ExistenciaNegativaItem[] = [];

  cargando = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Existencia';
  sortDirection: SortDirection = 'asc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly traspasosService: TraspasosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarExistenciasNegativas();
  }

  retry(): void {
    this.cargarExistenciasNegativas();
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
      Cantidad: item.Cantidad,
      Existencia: item.Existencia,
      Departamento: item.Departamento,
      Familia: item.Familia,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExistenciasNegativas');
    XLSX.writeFile(workbook, 'existencias-negativas.xlsx');
  }

  trackByCodigo(_: number, item: ExistenciaNegativaItem): string {
    return item.Codigo;
  }

  private cargarExistenciasNegativas(): void {
    this.error = '';
    this.cargando = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;
    this.markForCheck();

    this.traspasosService.obtenerExistenciasNegativas().subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message || 'No se pudieron obtener las existencias negativas.';
        this.cargando = false;
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

  private matchesSearch(item: ExistenciaNegativaItem, term: string): boolean {
    return (item.Codigo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || String(item.Cantidad).toLowerCase().includes(term)
      || String(item.Existencia).toLowerCase().includes(term)
      || (item.Departamento || '').toLowerCase().includes(term)
      || (item.Familia || '').toLowerCase().includes(term);
  }

  private compareRows(a: ExistenciaNegativaItem, b: ExistenciaNegativaItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Cantidad':
      case 'Existencia':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Codigo':
      case 'Descripcion':
      case 'Departamento':
      case 'Familia':
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
}

