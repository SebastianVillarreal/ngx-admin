import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { CreditosService, CreditoCliente } from './creditos.service';

@Component({
  selector: 'ngx-cuentas-por-cobrar-creditos',
  templateUrl: './creditos.component.html',
  styleUrls: ['./creditos.component.scss'],
})
export class CreditosComponent implements OnInit {
  creditos: CreditoCliente[] = [];
  filteredCreditos: CreditoCliente[] = [];
  paginatedCreditos: CreditoCliente[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];
  readonly defaultSucursal = '1';

  constructor(
    private readonly creditosService: CreditosService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCreditos();
  }

  loadCreditos(): void {
    this.loading = true;
    this.errorMessage = '';
    this.creditos = [];
    this.filteredCreditos = [];
    this.paginatedCreditos = [];
    this.creditosService.fetchCreditos(this.defaultSucursal).subscribe({
      next: (items) => {
        this.creditos = items ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'No se pudo obtener la información de créditos.';
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  onRefresh(): void {
    this.searchTerm = '';
    this.loadCreditos();
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
    if (!this.filteredCreditos.length) {
      return;
    }

    const data = this.filteredCreditos.map((item) => ({
      Tickets: item.Tickets,
      Nombre: item.Nombre,
      Deuda: item.Deuda,
      Monto: item.Monto,
      RFC: item.Rfc || 'N/A',
      Telefono: item.Telefono || 'N/A',
      Comentarios: item.Comentarios || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Creditos');
    XLSX.writeFile(workbook, 'creditos.xlsx');
  }

  get totalItems(): number {
    return this.filteredCreditos.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedCreditos.length - 1 : 0;
  }

  trackById(_index: number, item: CreditoCliente): number {
    return item.Id;
  }

  openDetalle(credito: CreditoCliente): void {
    if (!credito?.Id) {
      return;
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/pages/cuentas-por-cobrar/creditos/detalle', credito.Id]),
    );
    window.open(url, '_blank');
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCreditos = term
      ? this.creditos.filter((item) => this.matchesTerm(item, term))
      : [...this.creditos];
    this.page = 1;
    this.buildPage();
  }

  private matchesTerm(item: CreditoCliente, term: string): boolean {
    const nombre = item.Nombre?.toLowerCase() ?? '';
    const rfc = item.Rfc?.toLowerCase() ?? '';
    const telefono = item.Telefono?.toLowerCase() ?? '';
    return nombre.includes(term) || rfc.includes(term) || telefono.includes(term);
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.page = 1;
      this.paginatedCreditos = [];
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedCreditos = this.filteredCreditos.slice(start, start + this.pageSize);
  }
}
