import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@nebular/theme';

import { DetalleTraspasoItem, TraspasoPendiente, TraspasosService } from '../traspasos/traspasos.service';

interface DetalleTraspasoEditable extends DetalleTraspasoItem {
  cantidadRecibida: number;
}

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
  autorizarMensaje = '';
  autorizarError = '';

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
    this.autorizarError = '';
    this.autorizarMensaje = '';
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
          cantidadRecibida: item.Cantidad,
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
    this.autorizarError = '';
    this.autorizarMensaje = 'Funcionalidad pendiente de definición.';
    this.markForCheck();
  }

  onCerrarDetalle(): void {
    if (this.detalleDialogRef) {
      this.detalleDialogRef.close();
      this.detalleDialogRef = null;
    }
    this.detalleSeleccionado = null;
    this.detalleRenglones = [];
    this.autorizarMensaje = '';
    this.autorizarError = '';
    this.markForCheck();
  }

  onCantidadRecibidaChange(renglon: DetalleTraspasoEditable, value: string): void {
    const cantidad = Number(value);
    const nuevaCantidad = Number.isFinite(cantidad) ? Math.max(cantidad, 0) : renglon.cantidadRecibida;

    this.detalleRenglones = this.detalleRenglones.map((item) =>
      item === renglon ? { ...item, cantidadRecibida: nuevaCantidad } : item,
    );
    this.markForCheck();
  }

  onCantidadRecibidaEnter(renglon: DetalleTraspasoEditable): void {
    this.autorizarMensaje = `Cantidad capturada para ${renglon.Codigo}: ${renglon.cantidadRecibida}. Pendiente integrar servicio.`;
    this.markForCheck();
  }

  private obtenerNombreSucursal(valor: string): string {
    return this.sucursales.find((s) => s.value === valor)?.label ?? 'la sucursal seleccionada';
  }

  private resetMensajes(): void {
    this.mensaje = '';
    this.error = '';
    this.autorizarError = '';
    this.autorizarMensaje = '';
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
