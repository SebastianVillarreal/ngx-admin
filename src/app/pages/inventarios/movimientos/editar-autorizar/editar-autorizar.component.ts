import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
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

  readonly pageSizeOptions: number[] = [10, 25, 50];
  pageSize = this.pageSizeOptions[0];
  paginaActual = 1;

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
    this.resetPagination();
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
          this.resetPagination();
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

  get movimientosPaginados(): MovimientoSinAfectar[] {
    if (!this.movimientos.length) {
      return [];
    }
    const inicio = (this.paginaActual - 1) * this.pageSize;
    return this.movimientos.slice(inicio, inicio + this.pageSize);
  }

  get totalPaginas(): number {
    if (!this.movimientos.length) {
      return 0;
    }
    return Math.ceil(this.movimientos.length / this.pageSize);
  }

  get paginaDesde(): number {
    if (!this.movimientos.length) {
      return 0;
    }
    return (this.paginaActual - 1) * this.pageSize + 1;
  }

  get paginaHasta(): number {
    if (!this.movimientos.length) {
      return 0;
    }
    return Math.min(this.paginaDesde + this.pageSize - 1, this.movimientos.length);
  }

  trackByRenglon(_: number, renglon: RenglonMovimiento): number {
    return renglon.Id;
  }

  cambiarPagina(paso: number): void {
    if (!this.movimientos.length) {
      return;
    }
    const destino = this.paginaActual + paso;
    if (destino < 1) {
      return;
    }
    if (this.totalPaginas && destino > this.totalPaginas) {
      return;
    }
    this.paginaActual = destino;
  }

  onPageSizeChange(size: number): void {
    const nuevoTamano = Number(size);
    this.pageSize = this.pageSizeOptions.includes(nuevoTamano) ? nuevoTamano : this.pageSizeOptions[0];
    this.resetPagination();
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
    const renglonesSnapshot = this.renglones.map((item) => ({ ...item }));

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
          try {
            this.generarComprobanteAutorizacionPdf(movimiento, renglonesSnapshot);
          } catch (error) {
            console.error('Error al generar el comprobante PDF', error);
            this.autorizarError = 'Movimiento autorizado, pero no se pudo generar el comprobante en PDF.';
          }
          this.movimientos = this.movimientos.filter((item) => item.Id !== movimiento.Id);
          this.ajustarPaginaDespuesCambio();
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

  private resetPagination(): void {
    this.paginaActual = 1;
  }

  private ajustarPaginaDespuesCambio(): void {
    if (!this.movimientos.length) {
      this.paginaActual = 1;
      return;
    }
    const totalPaginas = this.totalPaginas || 1;
    if (this.paginaActual > totalPaginas) {
      this.paginaActual = totalPaginas;
    }
  }

  private obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  private generarComprobanteAutorizacionPdf(
    movimiento: MovimientoSinAfectar,
    renglones: RenglonMovimiento[],
  ): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Comprobante de movimiento autorizado', 105, 16, { align: 'center' });

    const fechaAutorizacion = this.formatFechaParaPdf(new Date());
    const fechaMovimiento = this.formatFechaParaPdf(movimiento.Fecha);
    const sucursal = movimiento.NombreSucursal || `Sucursal ${movimiento.IdSucursal ?? 'N/D'}`;
    const tipo = movimiento.TipoMovimiento || movimiento.Movimiento || 'N/D';

    doc.setFontSize(11);
    doc.text(`Folio: ${movimiento.Folio ?? 'N/D'}`, 15, 30);
    doc.text(`Autorizado: ${fechaAutorizacion}`, 105, 30);
    doc.text(`Tipo: ${tipo}`, 15, 38);
    doc.text(`Sucursal: ${sucursal}`, 105, 38);
    doc.text(`Fecha original: ${fechaMovimiento}`, 15, 46);

    doc.setFontSize(12);
    doc.text('Detalle de artículos', 15, 60);
    doc.setFontSize(10);
    let cursorY = 66;
    const drawHeader = () => {
      doc.text('Código', 15, cursorY);
      doc.text('Descripción', 60, cursorY);
      doc.text('Cantidad', 195, cursorY, { align: 'right' });
      cursorY += 6;
    };

    drawHeader();

    if (!renglones.length) {
      doc.text('Sin renglones capturados.', 15, cursorY);
    } else {
      renglones.forEach((item) => {
        if (cursorY > 270) {
          doc.addPage();
          cursorY = 20;
          drawHeader();
        }
        doc.text(item.Articulo, 15, cursorY);
        doc.text(this.truncateText(item.Descripcion, 70), 60, cursorY);
        doc.text(this.formatCantidad(item.Cantidad), 195, cursorY, { align: 'right' });
        cursorY += 6;
      });
    }

    const folio = movimiento.Folio ?? movimiento.Id;
    doc.save(`Comprobante-Autorizacion-${folio}.pdf`);
  }

  private formatFechaParaPdf(input?: string | Date): string {
    if (!input) {
      return 'N/D';
    }
    const date = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(date.getTime())) {
      return 'N/D';
    }
    return date.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private truncateText(text: string | undefined, maxLength = 70): string {
    if (!text) {
      return '';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  private formatCantidad(value: number): string {
    const numeric = Number(value) || 0;
    return numeric.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
