import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { CotizacionSinFinalizarItem, CotizacionesService } from './cotizaciones.service';

type SortColumn = 'Id' | 'IdSucursal' | 'IdProveedor' | 'Proveedor' | 'Comprador' | 'Fecha';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-cotizaciones-sin-finalizar',
  templateUrl: './cotizaciones-sin-finalizar.component.html',
  styleUrls: ['./cotizaciones-sin-finalizar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesSinFinalizarComponent implements OnInit {
  items: CotizacionSinFinalizarItem[] = [];
  displayItems: CotizacionSinFinalizarItem[] = [];
  paginatedItems: CotizacionSinFinalizarItem[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Id';
  sortDirection: SortDirection = 'desc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly cotizacionesService: CotizacionesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

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

    this.cotizacionesService.obtenerCotizacionesSinFinalizar().subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: Error) => {
        this.loading = false;
        this.error = err?.message || 'No se pudieron obtener las cotizaciones sin finalizar.';
        this.cdr.markForCheck();
      },
    });
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
    return this.sortDirection === 'asc' ? '▲' : '▼';
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
      IdSucursal: item.IdSucursal,
      IdProveedor: item.IdProveedor,
      Proveedor: item.Proveedor,
      Comprador: item.Comprador,
      Fecha: item.Fecha,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SinFinalizar');
    XLSX.writeFile(workbook, 'cotizaciones-sin-finalizar.xlsx');
  }

  trackById(_: number, item: CotizacionSinFinalizarItem): number {
    return item.Id;
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) => this.matchesTerm(item, term))
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
    this.cdr.markForCheck();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
    this.cdr.markForCheck();
  }

  private matchesTerm(item: CotizacionSinFinalizarItem, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || String(item.IdSucursal).toLowerCase().includes(term)
      || String(item.IdProveedor).toLowerCase().includes(term)
      || (item.Proveedor || '').toLowerCase().includes(term)
      || (item.Comprador || '').toLowerCase().includes(term)
      || (item.Fecha || '').toLowerCase().includes(term);
  }

  private compareRows(a: CotizacionSinFinalizarItem, b: CotizacionSinFinalizarItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Id':
      case 'IdSucursal':
      case 'IdProveedor':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Proveedor':
      case 'Comprador':
      case 'Fecha':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }
}
