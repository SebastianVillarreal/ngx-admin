import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  private readonly usuarioEntregaId = '1';

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
  editandoCantidadId: number | null = null;
  cantidadForm: FormGroup;
  cantidadMensaje = '';
  cantidadError = '';
  cantidadActualizando = false;
  autorizarMensaje = '';
  autorizarError = '';
  autorizarLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cantidadForm = this.fb.group({
      cantidad: [null, [Validators.required, Validators.min(0)]],
    });
  }

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
    this.resetCantidadState();
    this.autorizarMensaje = '';
    this.autorizarError = '';
    this.autorizarLoading = false;
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
    this.resetCantidadState();
    this.autorizarMensaje = '';
    this.autorizarError = '';
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

  autorizarMovimiento(): void {
    this.autorizarMensaje = '';
    this.autorizarError = '';
    const movimiento = this.movimientoSeleccionado;
    if (!movimiento) {
      this.autorizarError = 'Selecciona un movimiento para autorizar.';
      return;
    }

    const tipoMovimiento = movimiento.Movimiento ?? movimiento.TipoMovimiento ?? '';
    if (!tipoMovimiento) {
      this.autorizarError = 'El movimiento seleccionado no tiene una clave de tipo válida.';
      return;
    }

    const payload = {
      Folio: String(movimiento.Folio ?? ''),
      TipoMovimiento: tipoMovimiento,
      UsuarioEntrega: this.usuarioEntregaId,
      IdSucursal: String(movimiento.IdSucursal ?? ''),
      Fecha: this.obtenerFechaActual(),
    };

    this.autorizarLoading = true;
    this.inventariosService
      .autorizarMovimiento(payload)
      .pipe(
        finalize(() => {
          this.autorizarLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.autorizarMensaje = `Movimiento ${movimiento.Folio} autorizado correctamente.`;
          this.movimientos = this.movimientos.filter((item) => item.Id !== movimiento.Id);
          this.movimientoSeleccionado = undefined;
          this.renglones = [];
          this.renglonesError = '';
          this.resetCantidadState();
        },
        error: (error: Error) => {
          this.autorizarError = error.message;
        },
      });
  }

  iniciarEdicionCantidad(renglon: RenglonMovimiento): void {
    this.editandoCantidadId = renglon.Id;
    this.cantidadForm.reset({ cantidad: renglon.Cantidad });
    this.cantidadMensaje = '';
    this.cantidadError = '';
  }

  cancelarEdicionCantidad(): void {
    this.resetCantidadState();
  }

  guardarCantidad(renglon: RenglonMovimiento): void {
    this.cantidadMensaje = '';
    this.cantidadError = '';
    if (this.editandoCantidadId !== renglon.Id) {
      return;
    }

    if (this.cantidadForm.invalid) {
      this.cantidadForm.markAllAsTouched();
      return;
    }

    const nuevaCantidad = Number(this.cantidadForm.get('cantidad')?.value);
    if (isNaN(nuevaCantidad)) {
      this.cantidadError = 'Ingresa una cantidad válida.';
      return;
    }

    if (!this.movimientoSeleccionado) {
      this.cantidadError = 'Selecciona un movimiento antes de actualizar la cantidad.';
      return;
    }

    const payload = {
      Articulo: renglon.Articulo,
      Cantidad: nuevaCantidad.toString(),
      Folio: String(this.movimientoSeleccionado.Folio ?? ''),
      Tipo: this.movimientoSeleccionado.Movimiento ?? '',
      IdSucursal: String(this.movimientoSeleccionado.IdSucursal ?? ''),
      Id: renglon.Id.toString(),
    };

    this.cantidadActualizando = true;
    this.inventariosService
      .actualizarCantidadRenglon(payload)
      .pipe(
        finalize(() => {
          this.cantidadActualizando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          renglon.Cantidad = nuevaCantidad;
          this.cantidadMensaje = 'Cantidad actualizada correctamente.';
          this.resetCantidadState();
        },
        error: (error: Error) => {
          this.cantidadError = error.message;
        },
      });
  }

  private resetCantidadState(): void {
    this.editandoCantidadId = null;
    this.cantidadForm.reset();
    this.cantidadActualizando = false;
  }

  private obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }
}
