import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { PrecioProgramadoItem, PreciosProgramadosService } from './precios-programados.service';

type SortColumn = 'Id' | 'IdFolioCambioPrecio' | 'FechaAplicacion' | 'FechaCreacion' | 'NombreUsuario';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-precios-programados',
  templateUrl: './precios-programados.component.html',
  styleUrls: ['./precios-programados.component.scss'],
})
export class PreciosProgramadosComponent implements OnInit {
  items: PrecioProgramadoItem[] = [];
  displayItems: PrecioProgramadoItem[] = [];
  paginatedItems: PrecioProgramadoItem[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Id';
  sortDirection: SortDirection = 'asc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(private readonly preciosProgramadosService: PreciosProgramadosService) {}

  ngOnInit(): void {
    this.cargarProgramaciones();
  }

  retry(): void {
    this.cargarProgramaciones();
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
    return this.sortDirection === 'asc' ? '^' : 'v';
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
      IdFolioCambioPrecio: item.IdFolioCambioPrecio,
      FechaAplicacion: item.FechaAplicacion,
      FechaCreacion: this.formatFechaCreacion(item.FechaCreacion),
      NombreUsuario: item.NombreUsuario,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PreciosProgramados');
    XLSX.writeFile(workbook, 'precios-programados.xlsx');
  }

  trackById(_: number, item: PrecioProgramadoItem): number {
    return item.Id;
  }

  formatFechaCreacion(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value || '';
    }
    return date.toLocaleString('es-MX');
  }

  private cargarProgramaciones(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.preciosProgramadosService.obtenerProgramaciones().subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudieron cargar los precios programados.';
      },
    });
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) => this.matchesTerm(item, term))
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private matchesTerm(item: PrecioProgramadoItem, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || String(item.IdFolioCambioPrecio).toLowerCase().includes(term)
      || (item.FechaAplicacion || '').toLowerCase().includes(term)
      || this.formatFechaCreacion(item.FechaCreacion).toLowerCase().includes(term)
      || (item.NombreUsuario || '').toLowerCase().includes(term);
  }

  private compareRows(a: PrecioProgramadoItem, b: PrecioProgramadoItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Id':
      case 'IdFolioCambioPrecio':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'FechaAplicacion':
        result = this.parseFechaAplicacion(a.FechaAplicacion) - this.parseFechaAplicacion(b.FechaAplicacion);
        break;
      case 'FechaCreacion':
        result = this.parseFechaCreacion(a.FechaCreacion) - this.parseFechaCreacion(b.FechaCreacion);
        break;
      case 'NombreUsuario':
      default:
        result = String(a.NombreUsuario || '').localeCompare(String(b.NombreUsuario || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private parseFechaAplicacion(value: string): number {
    if (!value) {
      return 0;
    }
    const [day, month, year] = value.split('/');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private parseFechaCreacion(value: string): number {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
}

