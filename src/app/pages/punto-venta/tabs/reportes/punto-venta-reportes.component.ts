import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
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

interface TicketDetalleLineaItem {
  Articulo?: string;
  Codigo: string;
  Cantidad: number;
  Precio: number;
  Unidad: string;
  Descuento: number;
  PrecioOriginal: number;
  DescripcionArticulo: string;
  Descripcion: string;
}

interface TicketDetalleLineaResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: TicketDetalleLineaItem[];
  };
}

interface TicketDetalleItem {
  codigo: string;
  descripcion: string;
  Fecha: string;
  IdSucursal: number;
  Total: number;
  Impuestos: number;
  SubTotal: number;
  FolioInterno: string;
  Descuento: number;
  Caja: number;
  NombreSucursal: string;
  Cliente: string | null;
  Cajero: string;
  DescEstatus: string;
  Hora: string;
}

interface TicketDetalleResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: TicketDetalleItem[];
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

type DetalleSortColumn =
  | 'codigo'
  | 'descripcion'
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
  @ViewChild('ticketDetalleDialog', { static: true }) ticketDetalleDialog!: TemplateRef<any>;

  tickets: TicketItem[] = [];
  displayTickets: TicketItem[] = [];
  paginatedTickets: TicketItem[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  selectedTicketFolioInterno = '';
  ticketDetalleLineas: TicketDetalleLineaItem[] = [];
  ticketDetallePaginatedLineas: TicketDetalleLineaItem[] = [];
  ticketDetalleLoading = false;
  ticketDetalleError = '';
  ticketDetalleDialogRef: NbDialogRef<any> | null = null;
  ticketDetallePageSizeOptions = [10, 25, 50];
  ticketDetallePageSize = 10;
  ticketDetalleCurrentPage = 1;
  detalleCodigo = '';
  detalleItems: TicketDetalleItem[] = [];
  detalleDisplayItems: TicketDetalleItem[] = [];
  detallePaginatedItems: TicketDetalleItem[] = [];
  detalleSearchTerm = '';
  detalleLoading = false;
  detalleError = '';
  detalleSortColumn: DetalleSortColumn = 'Fecha';
  detalleSortDirection: 'asc' | 'desc' = 'desc';
  detallePageSizeOptions = [10, 25, 50];
  detallePageSize = 10;
  detalleCurrentPage = 1;
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

  constructor(
    private readonly http: HttpClient,
    private readonly dialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.error = '';
    this.tickets = [];
    this.displayTickets = [];
    this.paginatedTickets = [];
    this.selectedTicketFolioInterno = '';
    this.ticketDetalleLineas = [];
    this.ticketDetallePaginatedLineas = [];
    this.ticketDetalleError = '';
    this.ticketDetalleLoading = false;
    this.ticketDetalleCurrentPage = 1;
    this.currentPage = 1;

    const body = {
      Sucursal: String(this.filtros.Sucursal || '').trim(),
      FechaInicial: this.toCompactDate(this.filtros.FechaInicial),
      FechaFinal: this.toCompactDate(this.filtros.FechaFinal),
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

  openTicketDetalleModal(item: TicketItem): void {
    const folioInterno = String(item?.FolioInterno || '').trim();
    if (!folioInterno) {
      this.ticketDetalleError = 'El ticket no contiene FolioInterno.';
      this.ticketDetalleLineas = [];
      this.ticketDetallePaginatedLineas = [];
      this.selectedTicketFolioInterno = '';
      return;
    }

    this.ticketDetalleDialogRef = this.dialogService.open(this.ticketDetalleDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: true,
    });
    this.verTicket(item);
  }

  closeTicketDetalleModal(ref?: NbDialogRef<any>): void {
    (ref || this.ticketDetalleDialogRef)?.close();
    this.ticketDetalleDialogRef = null;
  }

  verTicket(item: TicketItem): void {
    const folioInterno = String(item?.FolioInterno || '').trim();
    if (!folioInterno) {
      this.ticketDetalleError = 'El ticket no contiene FolioInterno.';
      this.ticketDetalleLineas = [];
      this.ticketDetallePaginatedLineas = [];
      this.selectedTicketFolioInterno = '';
      return;
    }

    this.ticketDetalleLoading = true;
    this.ticketDetalleError = '';
    this.ticketDetalleLineas = [];
    this.ticketDetallePaginatedLineas = [];
    this.ticketDetalleCurrentPage = 1;
    this.selectedTicketFolioInterno = folioInterno;

    const body = {
      Id: 0,
      FolioInterno: folioInterno,
    };

    this.http
      .post<TicketDetalleLineaResponse>(`${environment.apiBase}/GetDetalleTicket`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = (res?.StatusCode ?? 200) === 200 && res?.success !== false;
          if (!ok) {
            this.ticketDetalleError = res?.message || 'No se pudo cargar el detalle del ticket.';
            return;
          }
          this.ticketDetalleLineas = (res?.response?.data || []).map((linea) => ({
            ...linea,
            Articulo: String(linea?.Articulo || '').trim(),
            Codigo: String(linea?.Articulo || linea?.Codigo || '').trim(),
            Unidad: String(linea?.Unidad || '').trim(),
            DescripcionArticulo: String(linea?.DescripcionArticulo || '').trim(),
            Descripcion: String(linea?.Descripcion || '').trim(),
          }));
          this.paginateTicketDetalleLineas();
        },
        error: (err) => {
          this.ticketDetalleError = err?.error?.message || err?.message || 'No se pudo cargar el detalle del ticket.';
          this.ticketDetalleLoading = false;
        },
        complete: () => {
          this.ticketDetalleLoading = false;
        },
      });
  }

  changeTicketDetallePageSize(size: number): void {
    this.ticketDetallePageSize = Number(size) || 10;
    this.ticketDetalleCurrentPage = 1;
    this.paginateTicketDetalleLineas();
  }

  previousTicketDetallePage(): void {
    if (this.ticketDetalleCurrentPage <= 1) {
      return;
    }
    this.ticketDetalleCurrentPage -= 1;
    this.paginateTicketDetalleLineas();
  }

  nextTicketDetallePage(): void {
    if (this.ticketDetalleCurrentPage >= this.ticketDetalleTotalPages) {
      return;
    }
    this.ticketDetalleCurrentPage += 1;
    this.paginateTicketDetalleLineas();
  }

  loadDetalle(): void {
    this.detalleLoading = true;
    this.detalleError = '';
    this.detalleItems = [];
    this.detalleDisplayItems = [];
    this.detallePaginatedItems = [];
    this.detalleCurrentPage = 1;

    const body = {
      IdSucursal: String(this.filtros.Sucursal || '').trim(),
      FechaInicial: this.toCompactDate(this.filtros.FechaInicial),
      FechaFinal: this.toCompactDate(this.filtros.FechaFinal),
      Tipo: String(this.filtros.Tipo || '').trim(),
      Codigo: String(this.detalleCodigo || '').trim(),
    };

    if (!body.IdSucursal || !body.FechaInicial || !body.FechaFinal || !body.Tipo || !body.Codigo) {
      this.detalleLoading = false;
      this.detalleError = 'Completa Sucursal, fechas, Tipo y Codigo para consultar el detalle.';
      return;
    }

    this.http
      .post<TicketDetalleResponse>(`${environment.apiBase}/GetTicketsDtl`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const ok = (res?.StatusCode ?? 200) === 200 && res?.success !== false;
          if (!ok) {
            this.detalleError = res?.message || 'No se pudo cargar el detalle.';
            return;
          }
          const data = res?.response?.data || [];
          this.detalleItems = data.map((item) => ({
            ...item,
            codigo: String(item?.codigo || '').trim(),
            descripcion: String(item?.descripcion || '').trim(),
            Fecha: String(item?.Fecha || '').trim(),
            Hora: String(item?.Hora || '').trim(),
            Cliente: String(item?.Cliente || '').trim(),
            Cajero: String(item?.Cajero || '').trim(),
            NombreSucursal: String(item?.NombreSucursal || '').trim(),
          }));
          this.applyDetalleTransforms();
        },
        error: (err) => {
          this.detalleError = err?.error?.message || err?.message || 'No se pudo cargar el detalle.';
          this.detalleLoading = false;
        },
        complete: () => {
          this.detalleLoading = false;
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyTransforms();
  }

  onDetalleSearch(term: string): void {
    this.detalleSearchTerm = term;
    this.detalleCurrentPage = 1;
    this.applyDetalleTransforms();
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

  toggleDetalleSort(column: DetalleSortColumn): void {
    if (this.detalleSortColumn === column) {
      this.detalleSortDirection = this.detalleSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.detalleSortColumn = column;
      this.detalleSortDirection = 'asc';
    }
    this.applyDetalleTransforms();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '^' : 'v';
  }

  detalleSortIndicator(column: DetalleSortColumn): string {
    if (this.detalleSortColumn !== column) {
      return '';
    }
    return this.detalleSortDirection === 'asc' ? '^' : 'v';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.paginate();
  }

  changeDetallePageSize(size: number): void {
    this.detallePageSize = Number(size) || 10;
    this.detalleCurrentPage = 1;
    this.paginateDetalle();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.paginate();
  }

  previousDetallePage(): void {
    if (this.detalleCurrentPage <= 1) {
      return;
    }
    this.detalleCurrentPage -= 1;
    this.paginateDetalle();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.paginate();
  }

  nextDetallePage(): void {
    if (this.detalleCurrentPage >= this.detalleTotalPages) {
      return;
    }
    this.detalleCurrentPage += 1;
    this.paginateDetalle();
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

  exportDetalleToExcel(): void {
    if (!this.detalleDisplayItems.length) {
      return;
    }

    const rows = this.detalleDisplayItems.map((item) => ({
      Codigo: item.codigo,
      Descripcion: item.descripcion,
      Fecha: item.Fecha,
      Hora: item.Hora,
      Cliente: item.Cliente,
      Cajero: item.Cajero,
      Sucursal: item.NombreSucursal,
      Total: item.Total,
      Impuestos: item.Impuestos,
      SubTotal: item.SubTotal,
      Descuento: item.Descuento,
      Caja: item.Caja,
      FolioInterno: item.FolioInterno,
      Estatus: item.DescEstatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DetalleTickets');
    XLSX.writeFile(workbook, 'punto-venta-detalle-tickets.xlsx');
  }

  trackById(_: number, item: TicketItem): number {
    return Number(item?.Id || 0);
  }

  trackByDetalleLinea(_: number, item: TicketDetalleLineaItem): string {
    return `${item.Articulo || item.Codigo}-${item.Descripcion}-${item.Unidad}`;
  }

  trackByDetalleFolio(_: number, item: TicketDetalleItem): string {
    return `${item.FolioInterno}-${item.codigo}-${item.Fecha}-${item.Hora}`;
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

  get detalleTotalPages(): number {
    return Math.max(1, Math.ceil(this.detalleDisplayItems.length / this.detallePageSize));
  }

  get ticketDetalleTotalPages(): number {
    return Math.max(1, Math.ceil(this.ticketDetalleLineas.length / this.ticketDetallePageSize));
  }

  get ticketDetallePageStart(): number {
    if (!this.ticketDetalleLineas.length) {
      return 0;
    }
    return (this.ticketDetalleCurrentPage - 1) * this.ticketDetallePageSize + 1;
  }

  get ticketDetallePageEnd(): number {
    if (!this.ticketDetalleLineas.length) {
      return 0;
    }
    return Math.min(this.ticketDetalleCurrentPage * this.ticketDetallePageSize, this.ticketDetalleLineas.length);
  }

  get detallePageStart(): number {
    if (!this.detalleDisplayItems.length) {
      return 0;
    }
    return (this.detalleCurrentPage - 1) * this.detallePageSize + 1;
  }

  get detallePageEnd(): number {
    if (!this.detalleDisplayItems.length) {
      return 0;
    }
    return Math.min(this.detalleCurrentPage * this.detallePageSize, this.detalleDisplayItems.length);
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

  private paginateTicketDetalleLineas(): void {
    const start = (this.ticketDetalleCurrentPage - 1) * this.ticketDetallePageSize;
    const end = start + this.ticketDetallePageSize;
    this.ticketDetallePaginatedLineas = this.ticketDetalleLineas.slice(start, end);
  }

  private applyDetalleTransforms(): void {
    const term = this.detalleSearchTerm.trim().toLowerCase();
    const filtered = term
      ? this.detalleItems.filter(
        (item) =>
          item.codigo.toLowerCase().includes(term)
          || item.descripcion.toLowerCase().includes(term)
          || item.Fecha.toLowerCase().includes(term)
          || item.Hora.toLowerCase().includes(term)
          || String(item.Cliente || '').toLowerCase().includes(term)
          || item.Cajero.toLowerCase().includes(term)
          || item.NombreSucursal.toLowerCase().includes(term)
          || item.FolioInterno.toLowerCase().includes(term),
      )
      : [...this.detalleItems];

    this.detalleDisplayItems = filtered.sort((a, b) => this.compareDetalleRows(a, b));
    this.paginateDetalle();
  }

  private paginateDetalle(): void {
    const start = (this.detalleCurrentPage - 1) * this.detallePageSize;
    const end = start + this.detallePageSize;
    this.detallePaginatedItems = this.detalleDisplayItems.slice(start, end);
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

  private compareDetalleRows(a: TicketDetalleItem, b: TicketDetalleItem): number {
    const factor = this.detalleSortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.detalleSortColumn) {
      case 'codigo':
        result = a.codigo.localeCompare(b.codigo, 'es', { sensitivity: 'base' });
        break;
      case 'descripcion':
        result = a.descripcion.localeCompare(b.descripcion, 'es', { sensitivity: 'base' });
        break;
      case 'Fecha':
        result = a.Fecha.localeCompare(b.Fecha, 'es', { sensitivity: 'base' });
        break;
      case 'Hora':
        result = a.Hora.localeCompare(b.Hora, 'es', { sensitivity: 'base' });
        break;
      case 'Cliente':
        result = String(a.Cliente || '').localeCompare(String(b.Cliente || ''), 'es', { sensitivity: 'base' });
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

  private toCompactDate(value: string): string {
    return String(value || '').replace(/-/g, '').trim();
  }

  ngOnDestroy(): void {
    this.closeTicketDetalleModal();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
