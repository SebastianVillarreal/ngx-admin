import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  InventariosService,
  MovimientoSinAfectar,
  MovimientosSinAfectarPayload,
  RenglonMovimiento,
  GetRenglonesMovimientoPayload,
} from '../../inventarios.service';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-editar-autorizar',
  templateUrl: './editar-autorizar.component.html',
  styleUrls: ['./editar-autorizar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarAutorizarComponent {
  readonly sucursales: SelectOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly sentidos: SelectOption[] = [
    { value: '1', label: 'Entrada' },
    { value: '2', label: 'Salida' },
  ];

  readonly filtrosForm = this.fb.group({
    sucursal: ['', Validators.required],
    sentido: ['', Validators.required],
  });

  mostrando = false;
  mensaje = '';
  movimientos: MovimientoSinAfectar[] = [];
  consultaRealizada = false;
  errorMensaje = '';
  movimientoSeleccionado?: MovimientoSinAfectar;
  renglones: RenglonMovimiento[] = [];
  renglonesLoading = false;
  renglonesError = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  mostrar(): void {
    this.mensaje = '';
    this.errorMensaje = '';
    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      return;
    }

    this.mostrando = true;
    this.consultaRealizada = false;
    this.movimientos = [];
    this.movimientoSeleccionado = undefined;
    this.renglones = [];
    this.renglonesError = '';
    const { sucursal, sentido } = this.filtrosForm.getRawValue();
    const sucursalNombre = this.obtenerEtiqueta(this.sucursales, sucursal);
    const sentidoNombre = this.obtenerEtiqueta(this.sentidos, sentido);
    const payload: MovimientosSinAfectarPayload = {
      IdSucursal: sucursal ?? '',
      Tipo: sentido ?? '',
    };

    this.inventariosService
      .fetchMovimientosSinAfectar(payload)
      .pipe(
        finalize(() => {
          this.mostrando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (movimientos) => {
          this.movimientos = movimientos;
          this.consultaRealizada = true;
          const resumen = movimientos.length ? `${movimientos.length} movimiento(s)` : 'sin movimientos';
          this.mensaje = `Se encontraron ${resumen} de ${sentidoNombre?.toLowerCase() ?? ''} para ${sucursalNombre}.`;
        },
        error: (error: Error) => {
          this.errorMensaje = error.message;
          this.consultaRealizada = true;
          this.mensaje = '';
        },
      });
  }

  private obtenerEtiqueta(options: SelectOption[], value: string | null): string {
    return options.find((option) => option.value === value)?.label ?? '';
  }

  get sinResultados(): boolean {
    return this.consultaRealizada && !this.mostrando && !this.errorMensaje && !this.movimientos.length;
  }

  trackByMovimiento(_: number, movimiento: MovimientoSinAfectar): number {
    return movimiento.Id;
  }

  trackByRenglon(_: number, renglon: RenglonMovimiento): number {
    return renglon.Id;
  }

  verRenglones(movimiento: MovimientoSinAfectar): void {
    this.movimientoSeleccionado = movimiento;
    this.renglones = [];
    this.renglonesError = '';
    const payload: GetRenglonesMovimientoPayload = {
      Folio: String(movimiento.Folio),
      Tipo: movimiento.Movimiento ?? '',
      IdSucursal: String(movimiento.IdSucursal ?? ''),
      Historico: '0',
      IdMovimiento: movimiento.Id.toString(),
    };

    if (!payload.Tipo) {
      this.renglonesError = 'El movimiento no tiene una clave de tipo válida.';
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
          this.renglones = renglones;
        },
        error: (error: Error) => {
          this.renglonesError = error.message;
        },
      });
  }
}
