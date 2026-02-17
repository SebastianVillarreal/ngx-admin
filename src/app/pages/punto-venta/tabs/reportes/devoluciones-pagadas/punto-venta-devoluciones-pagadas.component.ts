import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../../environments/environment';

interface DevolucionPagadaItem {
  Id: number;
  FolioInterno: string;
  Fecha: string;
  Estatus: string;
  Monto: number;
  Usuario: string;
}

interface DevolucionesPagadasResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: DevolucionPagadaItem[];
  };
}

type SortColumn = 'Id' | 'FolioInterno' | 'Fecha' | 'Estatus' | 'Monto' | 'Usuario';

@Component({
  selector: 'ngx-punto-venta-devoluciones-pagadas',
  templateUrl: './punto-venta-devoluciones-pagadas.component.html',
  styleUrls: ['./punto-venta-devoluciones-pagadas.component.scss'],
})
export class PuntoVentaDevolucionesPagadasComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  items: DevolucionPagadaItem[] = [];
  displayItems: DevolucionPagadaItem[] = [];
  paginatedItems: DevolucionPagadaItem[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  filtros = {
    FechaInicial: '2025-12-01',
    FechaFinal: '2025-12-18',
  };
  sortColumn: SortColumn = 'Fecha';
  sortDirection: 'asc' | 'desc' = 'desc';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    const body = {
      FechaInicial: String(this.filtros.FechaInicial || '').trim(),
      FechaFinal: String(this.filtros.FechaFinal || '').trim(),
    };

    if (!body.FechaInicial || !body.FechaFinal) {
      this.loading = false;
      this.error = 'Completa FechaInicial y FechaFinal para consultar.';
      return;
    }

    this.http
      .post<DevolucionesPagadasResponse>(`${environment.apiBase}/GetReporteDevolucionesPagadas`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = (res?.StatusCode ?? 200) === 200 && res?.success !== false;
          if (!ok) {
            this.error = res?.message || 'No se pudieron cargar las devoluciones pagadas.';
            return;
          }
          const data = res?.response?.data || [];
          this.items = data.map((item) => ({
            ...item,
            FolioInterno: String(item?.FolioInterno || '').trim(),
            Fecha: String(item?.Fecha || '').trim(),
            Estatus: String(item?.Estatus || '').trim(),
            Usuario: String(item?.Usuario || '').trim(),
          }));
          this.applyTransforms();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'No se pudieron cargar las devoluciones pagadas.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  retry(): void {
    this.buscar();
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
      Id: item.Id,
      FolioInterno: item.FolioInterno,
      Fecha: item.Fecha,
      Estatus: item.Estatus,
      Monto: item.Monto,
      Usuario: item.Usuario,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DevolucionesPagadas');
    XLSX.writeFile(workbook, 'punto-venta-devoluciones-pagadas.xlsx');
  }

  trackById(_: number, item: DevolucionPagadaItem): number {
    return Number(item?.Id || 0);
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
          String(item.Id).toLowerCase().includes(term)
          || item.FolioInterno.toLowerCase().includes(term)
          || item.Fecha.toLowerCase().includes(term)
          || item.Estatus.toLowerCase().includes(term)
          || String(item.Monto).toLowerCase().includes(term)
          || item.Usuario.toLowerCase().includes(term),
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

  private compareRows(a: DevolucionPagadaItem, b: DevolucionPagadaItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Id':
        result = Number(a.Id || 0) - Number(b.Id || 0);
        break;
      case 'FolioInterno':
        result = a.FolioInterno.localeCompare(b.FolioInterno, 'es', { sensitivity: 'base' });
        break;
      case 'Fecha':
        result = a.Fecha.localeCompare(b.Fecha, 'es', { sensitivity: 'base' });
        break;
      case 'Estatus':
        result = a.Estatus.localeCompare(b.Estatus, 'es', { sensitivity: 'base' });
        break;
      case 'Monto':
        result = Number(a.Monto || 0) - Number(b.Monto || 0);
        break;
      case 'Usuario':
        result = a.Usuario.localeCompare(b.Usuario, 'es', { sensitivity: 'base' });
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
