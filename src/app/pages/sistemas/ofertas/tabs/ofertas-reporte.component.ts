import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';

interface ReporteOfertaItem {
  Codigo: string;
  Descripcion: string;
  Departamento: string;
  Familia: string;
  Porcentaje: string;
  FechaInicia: string;
  FechaFinal: string;
  PrecioOriginal: number;
  PrecioOferta: number;
}

interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message?: string;
  response?: {
    data?: T[];
  };
}

@Component({
  selector: 'ngx-ofertas-reporte',
  templateUrl: './ofertas-reporte.component.html',
  styleUrls: ['./ofertas-reporte.component.scss'],
})
export class OfertasReporteComponent {
  constructor(private readonly http: HttpClient) {}

  fechaIni = '';
  fechaFin = '';
  tipoReporte = '3';
  readonly tipoReporteOptions = [
    { value: '1', label: 'Ofertas Activas' },
    { value: '2', label: 'Ofertas que vencen' },
    { value: '3', label: 'Ofertas que inician' },
  ];

  items: ReporteOfertaItem[] = [];
  displayItems: ReporteOfertaItem[] = [];
  paginatedItems: ReporteOfertaItem[] = [];

  searchTerm = '';
  sortColumn: keyof ReporteOfertaItem | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  loading = false;
  error = '';

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50, 100];

  buscar(): void {
    if (!this.fechaIni || !this.fechaFin) {
      this.error = 'Captura fecha inicial y fecha final.';
      this.items = [];
      this.displayItems = [];
      this.paginatedItems = [];
      return;
    }

    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];

    const params = new HttpParams()
      .set('fecha_ini', this.fechaIni)
      .set('fecha_fin', this.fechaFin)
      .set('tipo', this.tipoReporte);

    this.http
      .get<ApiResponse<ReporteOfertaItem>>(`${environment.apiBase}/GetReporteOfertas`, { params })
      .subscribe({
        next: (res) => {
          const ok = res?.success === true || res?.StatusCode === 200;
          const rows = ok ? res?.response?.data ?? [] : [];
          this.items = Array.isArray(rows) ? rows : [];
          this.currentPage = 1;
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'No fue posible cargar el reporte de ofertas.';
        },
      });
  }

  retry(): void {
    this.buscar();
  }

  onSearch(term: string): void {
    this.searchTerm = term ?? '';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  toggleSort(column: keyof ReporteOfertaItem): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  sortIndicator(column: keyof ReporteOfertaItem): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.buildPage();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.buildPage();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.buildPage();
    }
  }

  get totalPages(): number {
    if (!this.displayItems.length) {
      return 1;
    }
    return Math.ceil(this.displayItems.length / this.pageSize);
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
    return this.pageStart + this.paginatedItems.length - 1;
  }

  trackByCodigo(index: number, item: ReporteOfertaItem): string {
    return `${item.Codigo}-${item.FechaInicia}-${item.FechaFinal}-${index}`;
  }

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      Codigo: item.Codigo ?? '',
      Descripcion: item.Descripcion ?? '',
      Departamento: item.Departamento ?? '',
      Familia: item.Familia ?? '',
      Porcentaje: item.Porcentaje ?? '',
      FechaInicia: item.FechaInicia ?? '',
      FechaFinal: item.FechaFinal ?? '',
      PrecioOriginal: Number(item.PrecioOriginal ?? 0),
      PrecioOferta: Number(item.PrecioOferta ?? 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ReporteOfertas');

    const ini = this.fechaIni || 'sin-fecha-inicial';
    const fin = this.fechaFin || 'sin-fecha-final';
    XLSX.writeFile(workbook, `reporte-ofertas-${ini}-${fin}.xlsx`);
  }

  private applyFiltersAndSort(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const filtered = term
      ? this.items.filter((item) => {
          const values = [
            item.Codigo,
            item.Descripcion,
            item.Departamento,
            item.Familia,
            item.Porcentaje,
            item.FechaInicia,
            item.FechaFinal,
            String(item.PrecioOriginal ?? ''),
            String(item.PrecioOferta ?? ''),
          ].map((v) => `${v ?? ''}`.toLowerCase());

          return values.some((v) => v.includes(term));
        })
      : [...this.items];

    if (this.sortColumn) {
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        const leftValue = a[this.sortColumn];
        const rightValue = b[this.sortColumn];

        if (typeof leftValue === 'number' || typeof rightValue === 'number') {
          const leftNum = Number(leftValue ?? 0);
          const rightNum = Number(rightValue ?? 0);
          return (leftNum - rightNum) * direction;
        }

        const left = `${leftValue ?? ''}`.toLowerCase();
        const right = `${rightValue ?? ''}`.toLowerCase();

        if (left < right) {
          return -1 * direction;
        }
        if (left > right) {
          return 1 * direction;
        }
        return 0;
      });
    }

    this.displayItems = filtered;
    this.buildPage();
  }

  private buildPage(): void {
    if (!this.displayItems.length) {
      this.currentPage = 1;
      this.paginatedItems = [];
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, start + this.pageSize);
  }
}
