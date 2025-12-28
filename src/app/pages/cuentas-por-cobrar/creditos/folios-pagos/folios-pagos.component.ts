import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';

import { CreditosService, FolioAbono } from '../creditos.service';

interface FiltrosAplicados {
  fechaInicio: string | null;
  fechaFin: string | null;
}

@Component({
  selector: 'ngx-folios-pagos',
  templateUrl: './folios-pagos.component.html',
  styleUrls: ['./folios-pagos.component.scss'],
})
export class FoliosPagosComponent implements OnInit {
  filtrosForm: FormGroup;
  filtrosAplicados: FiltrosAplicados | null = null;
  loadingTabla = false;
  tablaError = '';
  folios: FolioAbono[] = [];
  filteredFolios: FolioAbono[] = [];
  paginatedFolios: FolioAbono[] = [];
  totalMonto = 0;
  searchTerm = '';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(private readonly fb: FormBuilder, private readonly creditosService: CreditosService) {
    this.filtrosForm = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
    });
  }

  ngOnInit(): void {
    this.setDefaultRango();
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.tablaError = '';
    const { fechaInicio, fechaFin } = this.filtrosForm.value;
    if (!fechaInicio || !fechaFin) {
      this.tablaError = 'Selecciona un rango de fechas para continuar.';
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      this.tablaError = 'La fecha inicial no puede ser mayor a la fecha final.';
      return;
    }

    this.filtrosAplicados = {
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
    };
    this.loadingTabla = true;
    this.folios = [];
    this.filteredFolios = [];
    this.paginatedFolios = [];
    this.totalMonto = 0;

    this.creditosService.fetchFoliosAbono(fechaInicio, fechaFin).subscribe({
      next: (folios) => {
        this.folios = folios ?? [];
        this.applyTableFilters();
        this.loadingTabla = false;
      },
      error: (err) => {
        this.tablaError = err?.message || 'No se pudo obtener la lista de folios.';
        this.loadingTabla = false;
      },
    });
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.setDefaultRango();
    this.filtrosAplicados = null;
    this.tablaError = '';
    this.aplicarFiltros();
  }

  private formatForInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private setDefaultRango(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filtrosForm.patchValue({
      fechaInicio: this.formatForInput(firstDay),
      fechaFin: this.formatForInput(today),
    });
  }

  private computeTotalMonto(folios: FolioAbono[]): number {
    return folios.reduce((acc, folio) => acc + (Number(folio.Monto) || 0), 0);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyTableFilters();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.buildPage();
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.buildPage();
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.buildPage();
    }
  }

  exportToExcel(): void {
    if (!this.filteredFolios.length) {
      return;
    }

    const data = this.filteredFolios.map((folio) => ({
      Folio: folio.Id,
      Cliente: folio.NombreCliente,
      RFC: folio.Rfc || 'N/A',
      Monto: folio.Monto,
      Referencia: folio.Referencia || '---',
      Fecha: folio.Fecha,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FoliosPagos');
    XLSX.writeFile(workbook, 'folios-pagos.xlsx');
  }

  get totalItems(): number {
    return this.filteredFolios.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedFolios.length - 1 : 0;
  }

  private applyTableFilters(): void {
    if (!this.folios.length) {
      this.filteredFolios = [];
      this.paginatedFolios = [];
      this.totalMonto = 0;
      this.page = 1;
      return;
    }

    const term = this.searchTerm.trim().toLowerCase();
    this.filteredFolios = term
      ? this.folios.filter((folio) => this.matchesTerm(folio, term))
      : [...this.folios];
    this.totalMonto = this.computeTotalMonto(this.filteredFolios);
    this.page = 1;
    this.buildPage();
  }

  private matchesTerm(folio: FolioAbono, term: string): boolean {
    const nombre = folio.NombreCliente?.toLowerCase() ?? '';
    const rfc = folio.Rfc?.toLowerCase() ?? '';
    const folioId = String(folio.Id);
    return nombre.includes(term) || rfc.includes(term) || folioId.includes(term);
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.paginatedFolios = [];
      this.page = 1;
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedFolios = this.filteredFolios.slice(start, start + this.pageSize);
  }
}
