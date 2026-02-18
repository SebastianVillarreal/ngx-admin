import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { BasculaArticuloItem, DeptoBasculasService } from './depto-basculas.service';

type SortColumn = 'Articulo' | 'Descripcion' | 'Precio' | 'Estatus';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-depto-basculas',
  templateUrl: './depto-basculas.component.html',
  styleUrls: ['./depto-basculas.component.scss'],
})
export class DeptoBasculasComponent implements OnInit {
  items: BasculaArticuloItem[] = [];
  displayItems: BasculaArticuloItem[] = [];
  paginatedItems: BasculaArticuloItem[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Articulo';
  sortDirection: SortDirection = 'asc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(private readonly deptoBasculasService: DeptoBasculasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.deptoBasculasService.obtenerArticulos().subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudieron cargar los articulos de bascula.';
      },
    });
  }

  retry(): void {
    this.cargar();
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
      Articulo: item.Articulo,
      Descripcion: item.Descripcion,
      Precio: item.Precio,
      Estatus: item.Estatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DeptoBasculas');
    XLSX.writeFile(workbook, 'depto-basculas.xlsx');
  }

  trackByArticulo(_: number, item: BasculaArticuloItem): string {
    return item.Articulo;
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

  private matchesTerm(item: BasculaArticuloItem, term: string): boolean {
    return (item.Articulo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || (item.Precio || '').toLowerCase().includes(term)
      || (item.Estatus || '').toLowerCase().includes(term);
  }

  private compareRows(a: BasculaArticuloItem, b: BasculaArticuloItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Precio':
        result = this.parsePrice(a.Precio) - this.parsePrice(b.Precio);
        break;
      case 'Articulo':
      case 'Descripcion':
      case 'Estatus':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private parsePrice(value: string): number {
    const normalized = String(value || '0').replace(/,/g, '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
