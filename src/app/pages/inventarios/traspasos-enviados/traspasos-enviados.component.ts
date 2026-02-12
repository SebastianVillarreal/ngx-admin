import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

import { TraspasoEnviado, TraspasosService } from '../traspasos/traspasos.service';

interface FiltroFormValue {
  fechaInicial: string;
  fechaFinal: string;
}

type SortColumn =
  | 'Id'
  | 'Folio'
  | 'Movimiento'
  | 'Fecha'
  | 'Referencia'
  | 'FolioEntrada'
  | 'SucursalDestino'
  | 'EstatusDestino'
  | 'EstatusOrigen'
  | 'FechaEntrada';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-traspasos-enviados',
  templateUrl: './traspasos-enviados.component.html',
  styleUrls: ['./traspasos-enviados.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraspasosEnviadosComponent implements OnInit {
  readonly filtroForm = this.fb.group({
    fechaInicial: this.fb.control('', Validators.required),
    fechaFinal: this.fb.control('', Validators.required),
  });

  items: TraspasoEnviado[] = [];
  displayItems: TraspasoEnviado[] = [];
  paginatedItems: TraspasoEnviado[] = [];

  cargando = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Fecha';
  sortDirection: SortDirection = 'desc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.establecerFechasIniciales();
    this.onBuscar();
  }

  onBuscar(): void {
    this.error = '';

    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.error = 'Completa el rango de fechas para continuar.';
      this.markForCheck();
      return;
    }

    const { fechaInicial, fechaFinal } = this.filtroForm.value as FiltroFormValue;

    if (new Date(fechaInicial) > new Date(fechaFinal)) {
      this.error = 'La fecha final debe ser mayor o igual a la fecha inicial.';
      this.markForCheck();
      return;
    }

    this.cargando = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;
    this.markForCheck();

    this.traspasosService.obtenerTraspasosEnviados(fechaInicial, fechaFinal).subscribe({
      next: (traspasos) => {
        this.items = traspasos || [];
        this.applyTransforms();
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener los traspasos enviados.';
        this.cargando = false;
        this.markForCheck();
      },
    });
  }

  retry(): void {
    this.onBuscar();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyTransforms();
    this.markForCheck();
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
    this.markForCheck();
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
    this.markForCheck();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.paginate();
    this.markForCheck();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.paginate();
    this.markForCheck();
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
      Folio: item.Folio,
      Movimiento: item.Movimiento,
      Fecha: item.Fecha,
      Referencia: item.Referencia,
      FolioEntrada: item.FolioEntrada,
      SucursalDestino: item.SucursalDestino,
      EstatusDestino: item.EstatusDestino,
      EstatusOrigen: item.EstatusOrigen,
      FechaEntrada: item.FechaEntrada,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TraspasosEnviados');
    XLSX.writeFile(workbook, 'traspasos-enviados.xlsx');
  }

  trackById(_: number, item: TraspasoEnviado): number {
    return item.Id;
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

  private matchesSearch(item: TraspasoEnviado, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || String(item.Folio).toLowerCase().includes(term)
      || (item.Movimiento || '').toLowerCase().includes(term)
      || (item.Fecha || '').toLowerCase().includes(term)
      || (item.Referencia || '').toLowerCase().includes(term)
      || String(item.FolioEntrada || '').toLowerCase().includes(term)
      || (item.SucursalDestino || '').toLowerCase().includes(term)
      || (item.EstatusDestino || '').toLowerCase().includes(term)
      || (item.EstatusOrigen || '').toLowerCase().includes(term)
      || (item.FechaEntrada || '').toLowerCase().includes(term);
  }

  private compareRows(a: TraspasoEnviado, b: TraspasoEnviado): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Id':
      case 'Folio':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Fecha':
      case 'FechaEntrada':
        result = this.parseSlashDate(a[this.sortColumn]) - this.parseSlashDate(b[this.sortColumn]);
        break;
      case 'Movimiento':
      case 'Referencia':
      case 'FolioEntrada':
      case 'SucursalDestino':
      case 'EstatusDestino':
      case 'EstatusOrigen':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }
    return result * factor;
  }

  private parseSlashDate(value: string): number {
    const parts = (value || '').split('/');
    if (parts.length !== 3) {
      return 0;
    }
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  private establecerFechasIniciales(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.filtroForm.patchValue({
      fechaInicial: this.formatearFecha(inicioMes),
      fechaFinal: this.formatearFecha(hoy),
    });
    this.markForCheck();
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}

