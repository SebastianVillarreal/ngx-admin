import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';

interface CodigoKioscoItem {
  Codigo: string;
  Ruta: string;
  Descripcion: string;
  Precio: number;
}

interface CodigosKioscoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: CodigoKioscoItem[];
  };
}

type SortColumn = 'Codigo' | 'Descripcion' | 'Ruta' | 'Precio';

@Component({
  selector: 'ngx-punto-venta-codigos-kiosco',
  templateUrl: './punto-venta-codigos-kiosco.component.html',
  styleUrls: ['./punto-venta-codigos-kiosco.component.scss'],
})
export class PuntoVentaCodigosKioscoComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  items: CodigoKioscoItem[] = [];
  displayItems: CodigoKioscoItem[] = [];
  paginatedItems: CodigoKioscoItem[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  sortColumn: SortColumn = 'Codigo';
  sortDirection: 'asc' | 'desc' = 'asc';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadCodigosKiosco();
  }

  loadCodigosKiosco(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.http
      .post<CodigosKioscoResponse>(`${environment.apiBase}/GetArticulosKiosco`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = (res?.StatusCode ?? 200) === 200 && res?.success !== false;
          if (!ok) {
            this.error = res?.message || 'No se pudieron cargar los codigos de kiosco.';
            return;
          }
          const data = res?.response?.data || [];
          this.items = data.map((item) => ({
            Codigo: String(item?.Codigo || '').trim(),
            Ruta: String(item?.Ruta || '').trim(),
            Descripcion: String(item?.Descripcion || '').trim(),
            Precio: Number(item?.Precio || 0),
          }));
          this.applyTransforms();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'No se pudieron cargar los codigos de kiosco.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  retry(): void {
    this.loadCodigosKiosco();
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

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      Codigo: item.Codigo,
      Descripcion: item.Descripcion,
      Precio: item.Precio,
      Ruta: item.Ruta,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CodigosKiosco');
    XLSX.writeFile(workbook, 'punto-venta-codigos-kiosco.xlsx');
  }

  trackByCodigo(_: number, item: CodigoKioscoItem): string {
    return item.Codigo;
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

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter(
        (item) =>
          item.Codigo.toLowerCase().includes(term)
          || item.Descripcion.toLowerCase().includes(term)
          || item.Ruta.toLowerCase().includes(term)
          || String(item.Precio).toLowerCase().includes(term),
      )
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private compareRows(a: CodigoKioscoItem, b: CodigoKioscoItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Codigo':
        result = a.Codigo.localeCompare(b.Codigo, 'es', { sensitivity: 'base' });
        break;
      case 'Descripcion':
        result = a.Descripcion.localeCompare(b.Descripcion, 'es', { sensitivity: 'base' });
        break;
      case 'Ruta':
        result = a.Ruta.localeCompare(b.Ruta, 'es', { sensitivity: 'base' });
        break;
      case 'Precio':
        result = Number(a.Precio || 0) - Number(b.Precio || 0);
        break;
      default:
        result = 0;
        break;
    }
    return result * factor;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
