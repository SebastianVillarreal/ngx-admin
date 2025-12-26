import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { FamiliasService, Familia } from './familias.service';

@Component({
  selector: 'ngx-catalogos-familias',
  templateUrl: './familias.component.html',
  styleUrls: ['./familias.component.scss'],
})
export class FamiliasComponent implements OnInit {
  familias: Familia[] = [];
  filteredFamilias: Familia[] = [];
  paginatedFamilias: Familia[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(private readonly familiasService: FamiliasService) {}

  ngOnInit(): void {
    this.loadFamilias();
  }

  loadFamilias(): void {
    this.loading = true;
    this.errorMessage = '';
    this.familias = [];
    this.filteredFamilias = [];
    this.paginatedFamilias = [];
    this.familiasService.fetchFamilias().subscribe({
      next: (items) => {
        this.familias = items ?? [];
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
    if (!this.filteredFamilias.length) {
      return;
    }

    const data = this.filteredFamilias.map((item) => ({
      Id: item.Id,
      Nombre: item.Nombre,
      NombreDepartamento: item.NombreDepartamento,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Familias');
    XLSX.writeFile(workbook, 'familias.xlsx');
  }

  get totalItems(): number {
    return this.filteredFamilias.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedFamilias.length - 1 : 0;
  }

  trackById(_index: number, item: Familia): number {
    return item.Id;
  }

  onView(familia: Familia): void {
    console.log('Ver familia', familia);
  }

  onEdit(familia: Familia): void {
    console.log('Editar familia', familia);
  }

  onDelete(familia: Familia): void {
    console.log('Eliminar familia', familia);
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredFamilias = term
      ? this.familias.filter((item) => this.matchesTerm(item, term))
      : [...this.familias];
    this.page = 1;
    this.buildPage();
  }

  private matchesTerm(item: Familia, term: string): boolean {
    const id = item.Id?.toString().toLowerCase() ?? '';
    const nombre = item.Nombre?.toLowerCase() ?? '';
    const departamento = item.NombreDepartamento?.toLowerCase() ?? '';
    return id.includes(term) || nombre.includes(term) || departamento.includes(term);
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.page = 1;
      this.paginatedFamilias = [];
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedFamilias = this.filteredFamilias.slice(start, start + this.pageSize);
  }
}
