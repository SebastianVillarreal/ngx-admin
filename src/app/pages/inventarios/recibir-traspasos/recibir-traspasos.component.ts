import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@nebular/theme';

import {
  ActualizarCantidadRecibidaPayload,
  DetalleTraspasoItem,
  RecibirTraspasoPayload,
  TraspasoPendiente,
  TraspasosService,
} from '../traspasos/traspasos.service';

type DetalleTraspasoEditable = DetalleTraspasoItem & { cantidadRecibida: number };

interface SucursalOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-recibir-traspasos',
  templateUrl: './recibir-traspasos.component.html',
  styleUrls: ['./recibir-traspasos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecibirTraspasosComponent {
  readonly sucursales: SucursalOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly filtroForm = this.fb.group({
    sucursal: this.fb.control('', Validators.required),
  });

  mensaje = '';
  error = '';
  cargando = false;
  pendientes: TraspasoPendiente[] = [];
  pageIndex = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20];

  detalleSeleccionado: TraspasoPendiente | null = null;
  detalleRenglones: DetalleTraspasoEditable[] = [];
  detalleCargando = false;
  detalleError = '';
  detalleMensaje = '';
  autorizarMensaje = '';
  autorizarError = '';
  actualizandoCantidadId: number | null = null;
  autorizando = false;

  private detalleDialogRef: NbDialogRef<unknown> | null = null;

  @ViewChild('detalleDialog', { static: true })
  detalleDialogTpl!: TemplateRef<unknown>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly dialogService: NbDialogService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onBuscar(): void {
    this.resetMensajes();

    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.error = 'Selecciona una sucursal para buscar traspasos.';
      this.markForCheck();
      return;
    }

    const sucursalSeleccionada = this.filtroForm.value.sucursal as string;
    const nombreSucursal = this.obtenerNombreSucursal(sucursalSeleccionada);

    this.cargando = true;
    this.pendientes = [];
    this.pageIndex = 1;
    this.markForCheck();

    this.traspasosService.obtenerTraspasosPendientes(sucursalSeleccionada).subscribe({
      next: (pendientes) => {
        this.pendientes = pendientes;
        this.mensaje = pendientes.length
          ? `Se encontraron ${pendientes.length} traspaso(s) pendientes para ${nombreSucursal}.`
          : `No hay traspasos pendientes para ${nombreSucursal}.`;
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener los traspasos pendientes.';
        this.cargando = false;
        this.markForCheck();
      },
    });
  }

  get pendientesPagina(): TraspasoPendiente[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.pendientes.slice(start, start + this.pageSize);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.pendientes.length / this.pageSize));
  }

  get puedeAnterior(): boolean {
    return this.pageIndex > 1;
  }

  get puedeSiguiente(): boolean {
    return this.pageIndex < this.totalPaginas;
  }

  onPageSizeChange(size: number | string): void {
    const nuevoTamano = Number(size);
    this.pageSize = Number.isFinite(nuevoTamano) && nuevoTamano > 0 ? nuevoTamano : this.pageSizeOptions[0];
    this.pageIndex = 1;
    this.markForCheck();
  }

  onPrevPage(): void {
    if (!this.puedeAnterior) {
      return;
    }
    this.pageIndex -= 1;
    this.markForCheck();
  }

  onNextPage(): void {
    if (!this.puedeSiguiente) {
      return;
    }
    this.pageIndex += 1;
    this.markForCheck();
  }

  onVerTraspaso(pendiente: TraspasoPendiente): void {
    this.detalleSeleccionado = pendiente;
    this.detalleRenglones = [];
    this.detalleError = '';
    this.detalleMensaje = '';
    this.autorizarError = '';
    this.autorizarMensaje = '';
    this.actualizandoCantidadId = null;
    this.detalleCargando = true;
    this.markForCheck();

    this.detalleDialogRef = this.dialogService.open(this.detalleDialogTpl, {
      context: pendiente,
      hasScroll: true,
      closeOnBackdropClick: false,
    });

    this.traspasosService.obtenerDetalleTraspaso(pendiente.Id).subscribe({
      next: (detalle) => {
        this.detalleRenglones = detalle.map((item) => ({
          ...item,
          cantidadRecibida: item.CantidadRecibida ?? item.Cantidad,
        }));
        this.detalleCargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.detalleError = error?.message ?? 'No se pudo cargar el detalle del traspaso.';
        this.detalleCargando = false;
        this.markForCheck();
      },
    });
  }

  onAutorizarTraspaso(): void {
    if (!this.detalleSeleccionado) {
      return;
    }

    this.autorizarError = '';
    this.autorizarMensaje = '';
    this.detalleMensaje = '';
    this.autorizando = true;
    this.markForCheck();

    const payload: RecibirTraspasoPayload = {
      IdMovimiento: String(this.detalleSeleccionado.Id),
      Usuario: '1',
    };

    this.traspasosService.recibirTraspaso(payload).subscribe({
      next: () => {
        const idProcesado = this.detalleSeleccionado?.Id;
        this.autorizarMensaje = 'Traspaso autorizado correctamente.';
        this.autorizando = false;
        if (idProcesado != null) {
          this.removerTraspasoProcesado(idProcesado);
        }
        this.cerrarDetalleSinReset();
        this.markForCheck();
      },
      error: (error) => {
        this.autorizarError = error?.message ?? 'No se pudo autorizar el traspaso.';
        this.autorizando = false;
        this.markForCheck();
      },
    });
  }

  onCerrarDetalle(): void {
    this.cerrarDetalleSinReset();
    this.detalleMensaje = '';
    this.autorizarMensaje = '';
    this.autorizarError = '';
    this.actualizandoCantidadId = null;
    this.autorizando = false;
  }

  onCantidadRecibidaChange(renglon: DetalleTraspasoEditable, value: string): void {
    const cantidad = Number(value);
    const nuevaCantidad = Number.isFinite(cantidad) ? Math.max(cantidad, 0) : renglon.cantidadRecibida;

    this.detalleMensaje = '';
    this.detalleError = '';
    this.detalleRenglones = this.detalleRenglones.map((item) =>
      item === renglon ? { ...item, cantidadRecibida: nuevaCantidad } : item,
    );
    this.markForCheck();
  }

  onCantidadRecibidaEnter(renglon: DetalleTraspasoEditable): void {
    if (this.actualizandoCantidadId) {
      return;
    }

    const payload: ActualizarCantidadRecibidaPayload = {
      IdRenglon: String(renglon.Id),
      CantidadRecibida: String(renglon.cantidadRecibida),
    };

    this.actualizandoCantidadId = renglon.Id;
    this.detalleMensaje = '';
    this.detalleError = '';
    this.markForCheck();

    this.traspasosService.actualizarCantidadRecibida(payload).subscribe({
      next: () => {
        this.detalleRenglones = this.detalleRenglones.map((item) =>
          item === renglon ? { ...item, CantidadRecibida: renglon.cantidadRecibida } : item,
        );
        this.detalleMensaje = `Cantidad recibida actualizada para ${renglon.Codigo}.`;
        this.actualizandoCantidadId = null;
        this.markForCheck();
      },
      error: (error) => {
        this.detalleError = error?.message ?? 'No se pudo actualizar la cantidad recibida.';
        this.actualizandoCantidadId = null;
        this.markForCheck();
      },
    });
  }

  private obtenerNombreSucursal(valor: string): string {
    return this.sucursales.find((s) => s.value === valor)?.label ?? 'la sucursal seleccionada';
  }

  private resetMensajes(): void {
    this.mensaje = '';
    this.error = '';
    this.autorizarError = '';
    this.autorizarMensaje = '';
    this.detalleMensaje = '';
  }

  private removerTraspasoProcesado(idMovimiento: number): void {
    this.pendientes = this.pendientes.filter((pendiente) => pendiente.Id !== idMovimiento);
    if (this.pendientes.length === 0) {
      this.pageIndex = 1;
    } else if (this.pageIndex > this.totalPaginas) {
      this.pageIndex = this.totalPaginas;
    }
  }

  private cerrarDetalleSinReset(): void {
    if (this.detalleDialogRef) {
      this.detalleDialogRef.close();
      this.detalleDialogRef = null;
    }
    this.detalleSeleccionado = null;
    this.detalleRenglones = [];
    this.detalleMensaje = '';
    this.actualizandoCantidadId = null;
    this.autorizando = false;
    this.markForCheck();
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
