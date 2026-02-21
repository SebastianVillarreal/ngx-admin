import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';

import {
  GetRenglonesMovimientoPayload,
  HistoricoMovimiento,
  HistoricoMovimientosPayload,
  InventariosService,
  RenglonMovimiento,
} from '../../inventarios.service';

interface SelectOption {
  value: string;
  label: string;
}

type SortColumn = 'Id' | 'NombreSucursal' | 'Folio' | 'TipoMovimiento' | 'Fecha' | 'Referencia' | 'NombreEstatus';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-historico-movimientos',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoComponent implements OnInit {
  readonly sucursales: SelectOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly historicoForm = this.fb.group({
    sucursal: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
  });

  buscando = false;
  historicoMovimientos: HistoricoMovimiento[] = [];
  historicoError = '';
  consultaRealizada = false;
  detalleSeleccionado?: HistoricoMovimiento;
  renglonesMovimiento: RenglonMovimiento[] = [];
  renglonesLoading = false;
  renglonesError = '';
  busquedaMensaje = '';
  busquedaError = '';
  readonly pageSizeOptions: number[] = [10, 25, 50];
  pageSize = this.pageSizeOptions[0];
  paginaActual = 1;
  searchTerm = '';
  displayMovimientos: HistoricoMovimiento[] = [];
  sortColumn: SortColumn = 'Fecha';
  sortDirection: SortDirection = 'desc';

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Sin inicialización adicional.
  }

  trackByHistorico(_: number, movimiento: HistoricoMovimiento): number {
    return movimiento.Id;
  }

  trackByRenglon(_: number, renglon: RenglonMovimiento): number {
    return renglon.Id;
  }

  get sinResultados(): boolean {
    return this.consultaRealizada && !this.historicoMovimientos.length && !this.historicoError;
  }

  get historicoPaginado(): HistoricoMovimiento[] {
    if (!this.displayMovimientos.length) {
      return [];
    }
    const inicio = (this.paginaActual - 1) * this.pageSize;
    return this.displayMovimientos.slice(inicio, inicio + this.pageSize);
  }

  get totalPaginas(): number {
    if (!this.displayMovimientos.length) {
      return 0;
    }
    return Math.ceil(this.displayMovimientos.length / this.pageSize);
  }

  get paginaDesde(): number {
    if (!this.displayMovimientos.length) {
      return 0;
    }
    return (this.paginaActual - 1) * this.pageSize + 1;
  }

  get paginaHasta(): number {
    if (!this.displayMovimientos.length) {
      return 0;
    }
    return Math.min(this.paginaDesde + this.pageSize - 1, this.displayMovimientos.length);
  }

  get sinCoincidenciasBusqueda(): boolean {
    return this.historicoMovimientos.length > 0 && this.displayMovimientos.length === 0 && !!this.searchTerm.trim();
  }

  ejecutarBusqueda(): void {
    this.busquedaMensaje = '';
    this.busquedaError = '';
    this.historicoError = '';
    this.searchTerm = '';
    this.detalleSeleccionado = undefined;
    this.resetDetalleState();
    this.resetPaginacion();
    if (this.historicoForm.invalid) {
      this.historicoForm.markAllAsTouched();
      return;
    }

    const { fechaInicio, fechaFin, sucursal } = this.historicoForm.getRawValue();
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      this.busquedaError = 'La fecha final debe ser posterior o igual a la fecha inicial.';
      return;
    }

    const payload: HistoricoMovimientosPayload = {
      Fecha: fechaInicio ?? '',
      FechaFin: fechaFin ?? '',
      IdSucursal: sucursal ?? '',
      TipoMovimiento: '',
    };

    this.buscando = true;
    this.historicoMovimientos = [];
    this.displayMovimientos = [];
    this.consultaRealizada = false;
    this.resetPaginacion();
    const sucursalLabel = this.getOptionLabel(this.sucursales, sucursal);

    this.inventariosService
      .fetchHistoricoMovimientos(payload)
      .pipe(
        finalize(() => {
          this.buscando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (movimientos) => {
          this.historicoError = '';
          this.historicoMovimientos = movimientos;
          this.applyTransforms();
          this.consultaRealizada = true;
          this.ensurePaginaEnRango();
          const total = movimientos.length;
          const fechas = `${this.formatFecha(fechaInicio)} al ${this.formatFecha(fechaFin)}`;
          this.busquedaMensaje = `Se encontraron ${total} movimiento(s) en ${sucursalLabel} del ${fechas}.`;
        },
        error: (error: Error) => {
          this.historicoError = error.message;
          this.busquedaMensaje = '';
          this.consultaRealizada = false;
          this.displayMovimientos = [];
          this.resetPaginacion();
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.resetPaginacion();
    this.applyTransforms();
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.resetPaginacion();
    this.applyTransforms();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  exportToExcel(): void {
    if (!this.displayMovimientos.length) {
      return;
    }

    const rows = this.displayMovimientos.map((movimiento) => ({
      Id: movimiento.Id,
      Sucursal: movimiento.NombreSucursal || `Sucursal ${movimiento.IdSucursal || ''}`,
      Folio: movimiento.Folio,
      'Tipo de movimiento': movimiento.TipoMovimiento,
      Fecha: this.formatFecha(movimiento.Fecha),
      Referencia: movimiento.Referencia || '',
      Estatus: movimiento.NombreEstatus || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HistoricoMovimientos');
    XLSX.writeFile(workbook, 'historico-movimientos.xlsx');
  }

  verDetalle(movimiento: HistoricoMovimiento): void {
    this.detalleSeleccionado = movimiento;
    this.resetDetalleState();

    if (!movimiento.TipoMovimiento) {
      this.renglonesError = 'El movimiento seleccionado no tiene un tipo válido.';
      return;
    }

    const payload: GetRenglonesMovimientoPayload = {
      Folio: String(movimiento.Folio ?? ''),
      Tipo: movimiento.TipoMovimiento,
      IdSucursal: String(movimiento.IdSucursal ?? ''),
      Historico: '1',
      IdMovimiento: movimiento.Id?.toString(),
    };

    if (!payload.Folio || !payload.IdSucursal) {
      this.renglonesError = 'El movimiento seleccionado no tiene información suficiente para consultar el detalle.';
      return;
    }

    this.renglonesLoading = true;
    this.inventariosService
      .fetchRenglonesMovimiento(payload)
      .pipe(
        finalize(() => {
          this.renglonesLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (renglones) => {
          this.renglonesMovimiento = renglones;
        },
        error: (error: Error) => {
          this.renglonesError = error.message;
        },
      });
  }

  cerrarDetalle(): void {
    this.detalleSeleccionado = undefined;
    this.resetDetalleState();
  }

  onPageSizeChange(size: number): void {
    const nuevoTamano = Number(size);
    if (!Number.isFinite(nuevoTamano) || nuevoTamano <= 0) {
      return;
    }
    if (this.pageSize === nuevoTamano) {
      return;
    }
    this.pageSize = nuevoTamano;
    this.resetPaginacion();
    this.ensurePaginaEnRango();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual -= 1;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual += 1;
    }
  }

  private getOptionLabel(options: SelectOption[], value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return options.find((option) => option.value === value)?.label ?? value;
  }

  private formatFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '---';
    }
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private resetDetalleState(): void {
    this.renglonesMovimiento = [];
    this.renglonesLoading = false;
    this.renglonesError = '';
  }

  private resetPaginacion(): void {
    this.paginaActual = 1;
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.historicoMovimientos.filter((item) => this.matchesTerm(item, term))
      : [...this.historicoMovimientos];

    this.displayMovimientos = filtered.sort((a, b) => this.compareRows(a, b));
    this.ensurePaginaEnRango();
    this.cdr.markForCheck();
  }

  private matchesTerm(item: HistoricoMovimiento, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || String(item.Folio).toLowerCase().includes(term)
      || String(item.IdSucursal).toLowerCase().includes(term)
      || (item.NombreSucursal || '').toLowerCase().includes(term)
      || (item.TipoMovimiento || '').toLowerCase().includes(term)
      || (item.Referencia || '').toLowerCase().includes(term)
      || (item.NombreEstatus || '').toLowerCase().includes(term)
      || this.formatFecha(item.Fecha).toLowerCase().includes(term);
  }

  private compareRows(a: HistoricoMovimiento, b: HistoricoMovimiento): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Id':
      case 'Folio':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Fecha':
        result = new Date(a.Fecha || '').getTime() - new Date(b.Fecha || '').getTime();
        break;
      case 'NombreSucursal':
      case 'TipoMovimiento':
      case 'Referencia':
      case 'NombreEstatus':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private ensurePaginaEnRango(): void {
    if (!this.displayMovimientos.length) {
      this.paginaActual = 1;
      return;
    }
    const total = this.totalPaginas;
    if (this.paginaActual > total) {
      this.paginaActual = total;
    }
    if (this.paginaActual < 1) {
      this.paginaActual = 1;
    }
  }
}
