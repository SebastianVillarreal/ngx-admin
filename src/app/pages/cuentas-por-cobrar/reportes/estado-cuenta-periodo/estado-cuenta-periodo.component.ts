import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { EstadoCuentaPeriodoItem, EstadoCuentaPeriodoService } from './estado-cuenta-periodo.service';

type SortColumn = 'IdCliente' | 'Cliente' | 'SaldoInicial' | 'CargoPeriodo' | 'AbonoPeriodo' | 'SaldoFinal';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-estado-cuenta-periodo',
  templateUrl: './estado-cuenta-periodo.component.html',
  styleUrls: ['./estado-cuenta-periodo.component.scss'],
})
export class EstadoCuentaPeriodoComponent implements OnInit {
  fechaInicial = '';
  fechaFinal = '';

  items: EstadoCuentaPeriodoItem[] = [];
  displayItems: EstadoCuentaPeriodoItem[] = [];
  paginatedItems: EstadoCuentaPeriodoItem[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'SaldoFinal';
  sortDirection: SortDirection = 'desc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(private readonly estadoCuentaPeriodoService: EstadoCuentaPeriodoService) {}

  ngOnInit(): void {
    const { firstDay, lastDay } = this.getCurrentMonthRange();
    this.fechaInicial = firstDay;
    this.fechaFinal = lastDay;
    this.consultar();
  }

  consultar(): void {
    this.error = '';
    if (!this.fechaInicial || !this.fechaFinal) {
      this.error = 'Debes indicar fecha inicial y fecha final.';
      return;
    }
    if (this.fechaInicial > this.fechaFinal) {
      this.error = 'La fecha inicial no puede ser mayor que la fecha final.';
      return;
    }

    this.loading = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.estadoCuentaPeriodoService.fetchEstadoCuentaPeriodo(this.fechaInicial, this.fechaFinal).subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo recuperar el estado de cuenta por periodo.';
      },
    });
  }

  retry(): void {
    this.consultar();
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

  get totalSaldoInicial(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.SaldoInicial) || 0), 0);
  }

  get totalCargoPeriodo(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.CargoPeriodo) || 0), 0);
  }

  get totalAbonoPeriodo(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.AbonoPeriodo) || 0), 0);
  }

  get totalSaldoFinal(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.SaldoFinal) || 0), 0);
  }

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      IdCliente: item.IdCliente,
      Cliente: item.Cliente,
      SaldoInicial: item.SaldoInicial,
      CargoPeriodo: item.CargoPeriodo,
      AbonoPeriodo: item.AbonoPeriodo,
      SaldoFinal: item.SaldoFinal,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EstadoCuentaPeriodo');
    XLSX.writeFile(workbook, `estado-cuenta-periodo-${this.fechaInicial}-${this.fechaFinal}.xlsx`);
  }

  trackByIdCliente(_: number, item: EstadoCuentaPeriodoItem): number {
    return item.IdCliente;
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

  private matchesSearch(item: EstadoCuentaPeriodoItem, term: string): boolean {
    return String(item.IdCliente).toLowerCase().includes(term)
      || (item.Cliente || '').toLowerCase().includes(term)
      || String(item.SaldoInicial).toLowerCase().includes(term)
      || String(item.CargoPeriodo).toLowerCase().includes(term)
      || String(item.AbonoPeriodo).toLowerCase().includes(term)
      || String(item.SaldoFinal).toLowerCase().includes(term);
  }

  private compareRows(a: EstadoCuentaPeriodoItem, b: EstadoCuentaPeriodoItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'IdCliente':
      case 'SaldoInicial':
      case 'CargoPeriodo':
      case 'AbonoPeriodo':
      case 'SaldoFinal':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Cliente':
      default:
        result = String(a.Cliente || '').localeCompare(String(b.Cliente || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }
    return result * factor;
  }

  private getCurrentMonthRange(): { firstDay: string; lastDay: string } {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      firstDay: this.toIsoDate(firstDay),
      lastDay: this.toIsoDate(lastDay),
    };
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

