import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { ExistenciasSeparadosService, ExistenciaSeparado } from './existencias.service';

@Component({
  selector: 'ngx-cxc-separados-existencias',
  templateUrl: './existencias.component.html',
  styleUrls: ['./existencias.component.scss'],
})
export class SeparadosExistenciasComponent implements OnInit {
  loading = true;
  errorMessage = '';
  existencias: ExistenciaSeparado[] = [];
  displayExistencias: ExistenciaSeparado[] = [];
  paginatedExistencias: ExistenciaSeparado[] = [];
  searchTerm = '';
  sortColumn: keyof ExistenciaSeparado = 'Id';
  sortDirection: 'asc' | 'desc' = 'asc';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(private readonly existenciasService: ExistenciasSeparadosService) {}

  ngOnInit(): void {
    this.loadExistencias();
  }

  loadExistencias(): void {
    this.loading = true;
    this.errorMessage = '';
    this.existencias = [];
    this.displayExistencias = [];
    this.paginatedExistencias = [];
    this.existenciasService.fetchExistencias().subscribe({
      next: (items) => {
        this.existencias = items ?? [];
        this.applyFiltersAndSort();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'No se pudo obtener la informacion de existencias.';
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term ?? '';
    this.applyFiltersAndSort();
  }

  setSort(column: keyof ExistenciaSeparado): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  isSortColumn(column: keyof ExistenciaSeparado): boolean {
    return this.sortColumn === column;
  }

  exportToExcel(): void {
    if (!this.displayExistencias.length) {
      return;
    }

    const data = this.displayExistencias.map((item) => ({
      Id: item.Id,
      Codigo: item.Codigo,
      Descripcion: item.Descripcion,
      Cantidad: item.Cantidad,
      PrecioVenta: item.PrecioVenta,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Existencias');
    XLSX.writeFile(workbook, 'existencias-separados.xlsx');
  }

  trackById(_index: number, item: ExistenciaSeparado): number {
    return item.Id;
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.buildPage();
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.buildPage();
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.buildPage();
    }
  }

  get totalItems(): number {
    return this.displayExistencias.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedExistencias.length - 1 : 0;
  }

  private applyFiltersAndSort(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.existencias.filter((item) => {
          const values = [
            item.Id,
            item.Codigo,
            item.Descripcion,
            item.Cantidad,
            item.PrecioVenta,
          ];
          return values.some((value) => String(value ?? '').toLowerCase().includes(term));
        })
      : [...this.existencias];

    filtered.sort((a, b) => this.compareValues(a[this.sortColumn], b[this.sortColumn]));
    this.displayExistencias = filtered;
    this.page = 1;
    this.buildPage();
  }

  private compareValues(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') {
      return this.sortDirection === 'asc' ? a - b : b - a;
    }

    const av = String(a ?? '').toLowerCase();
    const bv = String(b ?? '').toLowerCase();
    const cmp = av.localeCompare(bv);
    return this.sortDirection === 'asc' ? cmp : -cmp;
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.page = 1;
      this.paginatedExistencias = [];
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedExistencias = this.displayExistencias.slice(start, start + this.pageSize);
  }
}
