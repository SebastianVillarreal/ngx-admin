import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../../environments/environment';

interface CashbackOperacionItem {
  Id: number;
  FolioTicket: string;
  Monto: number;
  Fecha: string;
  Cajero: string;
  Caja: number;
}

interface CashbackOperacionResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: CashbackOperacionItem[];
  };
}

type SortColumn = 'Id' | 'FolioTicket' | 'Monto' | 'Fecha' | 'Cajero' | 'Caja';

@Component({
  selector: 'ngx-punto-venta-operaciones-cashback',
  templateUrl: './punto-venta-operaciones-cashback.component.html',
  styleUrls: ['./punto-venta-operaciones-cashback.component.scss'],
})
export class PuntoVentaOperacionesCashbackComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  items: CashbackOperacionItem[] = [];
  displayItems: CashbackOperacionItem[] = [];
  paginatedItems: CashbackOperacionItem[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  filtros = {
    fecha: '2026-02-15',
    fecha_final: '2026-02-15',
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

    const fecha = String(this.filtros.fecha || '').trim();
    const fechaFinal = String(this.filtros.fecha_final || '').trim();

    if (!fecha || !fechaFinal) {
      this.loading = false;
      this.error = 'Completa fecha y fecha_final para consultar.';
      return;
    }

    const params = new HttpParams()
      .set('fecha', fecha)
      .set('fecha_final', fechaFinal);

    this.http
      .get<CashbackOperacionResponse>(`${environment.apiBase}/GetTicketsCashback`, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = (res?.StatusCode ?? 200) === 200 && res?.success !== false;
          if (!ok) {
            this.error = res?.message || 'No se pudieron cargar las operaciones cashback.';
            return;
          }
          const data = res?.response?.data || [];
          this.items = data.map((item) => ({
            Id: Number(item?.Id || 0),
            FolioTicket: String(item?.FolioTicket || '').trim(),
            Monto: Number(item?.Monto || 0),
            Fecha: String(item?.Fecha || '').trim(),
            Cajero: String(item?.Cajero || '').trim(),
            Caja: Number(item?.Caja || 0),
          }));
          this.applyTransforms();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'No se pudieron cargar las operaciones cashback.';
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
      FolioTicket: item.FolioTicket,
      Monto: item.Monto,
      Fecha: item.Fecha,
      Cajero: item.Cajero,
      Caja: item.Caja,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OperacionesCashback');
    XLSX.writeFile(workbook, 'punto-venta-operaciones-cashback.xlsx');
  }

  trackById(_: number, item: CashbackOperacionItem): number {
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
          || item.FolioTicket.toLowerCase().includes(term)
          || String(item.Monto).toLowerCase().includes(term)
          || item.Fecha.toLowerCase().includes(term)
          || item.Cajero.toLowerCase().includes(term)
          || String(item.Caja).toLowerCase().includes(term),
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

  private compareRows(a: CashbackOperacionItem, b: CashbackOperacionItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Id':
        result = Number(a.Id || 0) - Number(b.Id || 0);
        break;
      case 'FolioTicket':
        result = a.FolioTicket.localeCompare(b.FolioTicket, 'es', { sensitivity: 'base' });
        break;
      case 'Monto':
        result = Number(a.Monto || 0) - Number(b.Monto || 0);
        break;
      case 'Fecha':
        result = a.Fecha.localeCompare(b.Fecha, 'es', { sensitivity: 'base' });
        break;
      case 'Cajero':
        result = a.Cajero.localeCompare(b.Cajero, 'es', { sensitivity: 'base' });
        break;
      case 'Caja':
        result = Number(a.Caja || 0) - Number(b.Caja || 0);
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
