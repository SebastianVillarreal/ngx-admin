import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

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

@Component({
  selector: 'ngx-historico-movimientos',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricoComponent implements OnInit, OnDestroy {
  readonly sucursales: SelectOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly sentidos: SelectOption[] = [
    { value: 'entrada', label: 'Entrada' },
    { value: 'salida', label: 'Salida' },
  ];

  readonly historicoForm = this.fb.group({
    sucursal: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    sentido: ['', Validators.required],
    tipoMovimiento: ['', Validators.required],
  });

  tiposMovimiento: SelectOption[] = [];
  tiposMovimientoLoading = false;
  tiposMovimientoError = '';
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

  private sentidoSubscription?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sentidoSubscription = this.historicoForm.get('sentido')?.valueChanges.subscribe((sentido) => {
      this.onSentidoChange(sentido);
    });
  }

  ngOnDestroy(): void {
    this.sentidoSubscription?.unsubscribe();
  }

  trackByTipo(_: number, option: SelectOption): string {
    return option.value;
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
    if (!this.historicoMovimientos.length) {
      return [];
    }
    const inicio = (this.paginaActual - 1) * this.pageSize;
    return this.historicoMovimientos.slice(inicio, inicio + this.pageSize);
  }

  get totalPaginas(): number {
    if (!this.historicoMovimientos.length) {
      return 0;
    }
    return Math.ceil(this.historicoMovimientos.length / this.pageSize);
  }

  get paginaDesde(): number {
    if (!this.historicoMovimientos.length) {
      return 0;
    }
    return (this.paginaActual - 1) * this.pageSize + 1;
  }

  get paginaHasta(): number {
    if (!this.historicoMovimientos.length) {
      return 0;
    }
    return Math.min(this.paginaDesde + this.pageSize - 1, this.historicoMovimientos.length);
  }

  ejecutarBusqueda(): void {
    this.busquedaMensaje = '';
    this.busquedaError = '';
    this.historicoError = '';
    this.detalleSeleccionado = undefined;
    this.resetDetalleState();
    this.resetPaginacion();
    if (this.historicoForm.invalid) {
      this.historicoForm.markAllAsTouched();
      return;
    }

    const { fechaInicio, fechaFin, sucursal, sentido, tipoMovimiento } = this.historicoForm.getRawValue();
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      this.busquedaError = 'La fecha final debe ser posterior o igual a la fecha inicial.';
      return;
    }

    const payload: HistoricoMovimientosPayload = {
      Fecha: fechaInicio ?? '',
      FechaFin: fechaFin ?? '',
      IdSucursal: sucursal ?? '',
      TipoMovimiento: tipoMovimiento ?? '',
    };

    this.buscando = true;
    this.historicoMovimientos = [];
    this.consultaRealizada = false;
  this.resetPaginacion();
    const sucursalLabel = this.getOptionLabel(this.sucursales, sucursal);
    const tipoLabel = this.getOptionLabel(this.tiposMovimiento, tipoMovimiento);

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
          this.consultaRealizada = true;
          this.ensurePaginaEnRango();
          const total = movimientos.length;
          const fechas = `${this.formatFecha(fechaInicio)} al ${this.formatFecha(fechaFin)}`;
          this.busquedaMensaje = `Se encontraron ${total} movimiento(s) en ${sucursalLabel} (${tipoLabel || 'N/D'}) del ${fechas}.`;
        },
        error: (error: Error) => {
          this.historicoError = error.message;
          this.busquedaMensaje = '';
          this.consultaRealizada = false;
          this.resetPaginacion();
        },
      });
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

  private onSentidoChange(sentido: string | null): void {
    this.historicoForm.get('tipoMovimiento')?.reset('');
    this.tiposMovimiento = [];
    this.tiposMovimientoError = '';

    const clave = this.mapSentidoToClave(sentido);
    if (!clave) {
      return;
    }

    this.tiposMovimientoLoading = true;
    this.inventariosService
      .fetchTipoMovimientos(clave)
      .pipe(
        finalize(() => {
          this.tiposMovimientoLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.tiposMovimiento = (items || []).map((item) => ({
            value: item.Clave,
            label: item.Nombre,
          }));
          if (this.tiposMovimiento.length === 1) {
            this.historicoForm.get('tipoMovimiento')?.setValue(this.tiposMovimiento[0].value);
          }
        },
        error: (error: Error) => {
          this.tiposMovimientoError = error.message;
        },
      });
  }

  private mapSentidoToClave(sentido: string | null | undefined): string {
    if (sentido === 'entrada') {
      return '1';
    }
    if (sentido === 'salida') {
      return '2';
    }
    return '';
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

  private ensurePaginaEnRango(): void {
    if (!this.historicoMovimientos.length) {
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
