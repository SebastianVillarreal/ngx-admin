import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { DepartamentosService, Departamento } from './departamentos.service';

@Component({
  selector: 'ngx-catalogos-departamentos',
  templateUrl: './departamentos.component.html',
  styleUrls: ['./departamentos.component.scss'],
})
export class DepartamentosComponent implements OnInit {
  departamentos: Departamento[] = [];
  filteredDepartamentos: Departamento[] = [];
  paginatedDepartamentos: Departamento[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(private readonly departamentosService: DepartamentosService) {}

  ngOnInit(): void {
    this.loadDepartamentos();
  }

  loadDepartamentos(): void {
    this.loading = true;
    this.errorMessage = '';
    this.departamentos = [];
    this.filteredDepartamentos = [];
    this.paginatedDepartamentos = [];
    this.departamentosService.fetchDepartamentos().subscribe({
      next: (items) => {
        this.departamentos = items ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Ocurrió un problema al recuperar los datos.';
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
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

  exportToExcel(): void {
    if (!this.filteredDepartamentos.length) {
      return;
    }

    const data = this.filteredDepartamentos.map((item) => ({
      Clave: item.Clave,
      Nombre: item.Nombre,
      Agrupacion: item.Agrupacion || 'Sin agrupación',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departamentos');
    XLSX.writeFile(workbook, 'departamentos.xlsx');
  }

  get totalItems(): number {
    return this.filteredDepartamentos.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedDepartamentos.length - 1 : 0;
  }

  trackById(_index: number, item: Departamento): number {
    return item.Id;
  }

  onView(departamento: Departamento): void {
    console.log('Ver departamento', departamento);
  }

  onEdit(departamento: Departamento): void {
    console.log('Editar departamento', departamento);
  }

  onDelete(departamento: Departamento): void {
    console.log('Eliminar departamento', departamento);
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDepartamentos = term
      ? this.departamentos.filter((item) => this.matchesTerm(item, term))
      : [...this.departamentos];
    this.page = 1;
    this.buildPage();
  }

  private matchesTerm(item: Departamento, term: string): boolean {
    const clave = item.Clave?.toLowerCase() ?? '';
    const nombre = item.Nombre?.toLowerCase() ?? '';
    const agrupacion = item.Agrupacion?.toLowerCase() ?? '';
    return clave.includes(term) || nombre.includes(term) || agrupacion.includes(term);
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.page = 1;
      this.paginatedDepartamentos = [];
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedDepartamentos = this.filteredDepartamentos.slice(start, start + this.pageSize);
  }
}
