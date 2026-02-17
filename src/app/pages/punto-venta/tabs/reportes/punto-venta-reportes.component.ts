import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';

interface TicketItem {
  Id: number;
  Folio: string;
  Fecha: string;
  IdSucursal: number;
  Total: number;
  Impuestos: number;
  SubTotal: number;
  FolioInterno: string;
  Descuento: number;
  Caja: number;
  AAAADDMM: string;
  NombreSucursal: string;
  Cliente: string;
  Cajero: string;
  numeroCliente: number;
  DescEstatus: string;
  Hora: string;
}

interface TicketsResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: TicketItem[];
  };
}

type SortColumn =
  | 'Folio'
  | 'Fecha'
  | 'Hora'
  | 'Cliente'
  | 'Cajero'
  | 'NombreSucursal'
  | 'Total';

@Component({
  selector: 'ngx-punto-venta-reportes',
  templateUrl: './punto-venta-reportes.component.html',
  styleUrls: ['./punto-venta-reportes.component.scss'],
})
export class PuntoVentaReportesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  tickets: TicketItem[] = [];
  displayTickets: TicketItem[] = [];
  paginatedTickets: TicketItem[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  filtros = {
    Sucursal: '1',
    FechaInicial: '2026-01-01',
    FechaFinal: '2026-01-02',
    Tipo: '1',
  };
  sortColumn: SortColumn = 'Fecha';
  sortDirection: 'asc' | 'desc' = 'desc';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.error = '';
    this.tickets = [];
    this.displayTickets = [];
    this.paginatedTickets = [];
    this.currentPage = 1;

    const body = {
      Sucursal: String(this.filtros.Sucursal || '').trim(),
      FechaInicial: String(this.filtros.FechaInicial || '').trim(),
      FechaFinal: String(this.filtros.FechaFinal || '').trim(),
      Tipo: String(this.filtros.Tipo || '').trim(),
    };

    if (!body.Sucursal || !body.FechaInicial || !body.FechaFinal || !body.Tipo) {
      this.loading = false;
      this.error = 'Completa los filtros requeridos para buscar tickets.';
      return;
    }

    console.log('Cargando tickets con filtros:', body);

    this.http
      .post<TicketsResponse>(`${environment.apiBase}/GetTickets`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = (res?.StatusCode ?? 200) === 200 && res?.success !== false;
          if (!ok) {
            this.error = res?.message || 'No se pudieron cargar los tickets.';
            return;
          }
          const data = res?.response?.data || [];
          this.tickets = data.map((item) => ({
            ...item,
            Folio: String(item?.Folio || '').trim(),
            Fecha: String(item?.Fecha || '').trim(),
            Hora: String(item?.Hora || '').trim(),
            Cliente: String(item?.Cliente || '').trim(),
            Cajero: String(item?.Cajero || '').trim(),
            NombreSucursal: String(item?.NombreSucursal || '').trim(),
          }));
          this.applyTransforms();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'No se pudieron cargar los tickets.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
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
    if (!this.displayTickets.length) {
      return;
    }

    const rows = this.displayTickets.map((item) => ({
      Folio: item.Folio,
      Fecha: item.Fecha,
      Hora: item.Hora,
      Cliente: item.Cliente,
      Cajero: item.Cajero,
      Sucursal: item.NombreSucursal,
      Total: item.Total,
      Estatus: item.DescEstatus,
      Caja: item.Caja,
      FolioInterno: item.FolioInterno,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
    XLSX.writeFile(workbook, 'punto-venta-tickets.xlsx');
  }

  trackById(_: number, item: TicketItem): number {
    return Number(item?.Id || 0);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayTickets.length / this.pageSize));
  }

  get pageStart(): number {
    if (!this.displayTickets.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (!this.displayTickets.length) {
      return 0;
    }
    return Math.min(this.currentPage * this.pageSize, this.displayTickets.length);
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.tickets.filter(
        (item) =>
          item.Folio.toLowerCase().includes(term)
          || item.Cliente.toLowerCase().includes(term)
          || item.Cajero.toLowerCase().includes(term)
          || item.NombreSucursal.toLowerCase().includes(term)
          || item.Fecha.toLowerCase().includes(term)
          || item.Hora.toLowerCase().includes(term),
      )
      : [...this.tickets];

    this.displayTickets = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTickets = this.displayTickets.slice(start, end);
  }

  private compareRows(a: TicketItem, b: TicketItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Folio':
        result = a.Folio.localeCompare(b.Folio, 'es', { sensitivity: 'base' });
        break;
      case 'Fecha':
        result = a.Fecha.localeCompare(b.Fecha, 'es', { sensitivity: 'base' });
        break;
      case 'Hora':
        result = a.Hora.localeCompare(b.Hora, 'es', { sensitivity: 'base' });
        break;
      case 'Cliente':
        result = a.Cliente.localeCompare(b.Cliente, 'es', { sensitivity: 'base' });
        break;
      case 'Cajero':
        result = a.Cajero.localeCompare(b.Cajero, 'es', { sensitivity: 'base' });
        break;
      case 'NombreSucursal':
        result = a.NombreSucursal.localeCompare(b.NombreSucursal, 'es', { sensitivity: 'base' });
        break;
      case 'Total':
        result = Number(a.Total || 0) - Number(b.Total || 0);
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
