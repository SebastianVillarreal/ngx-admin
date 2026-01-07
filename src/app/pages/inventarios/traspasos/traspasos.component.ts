import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import {
  DetalleTraspasoItem,
  InsertRenglonTraspasoPayload,
  NuevoTraspasoMetadata,
  NuevoTraspasoPayload,
  TraspasosService,
} from './traspasos.service';

@Component({
  selector: 'ngx-traspasos-inventarios',
  templateUrl: './traspasos.component.html',
  styleUrls: ['./traspasos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraspasosComponent {
  readonly sucursales = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  private readonly usuarioId = '1';

  readonly traspasoForm = this.fb.group({
    origen: this.fb.control('', Validators.required),
    destino: this.fb.control('', Validators.required),
    referencia: this.fb.control('', [Validators.required, Validators.minLength(3)]),
  });

  readonly detalleForm = this.fb.group({
    codigo: this.fb.control('', Validators.required),
    descripcion: this.fb.control('', Validators.required),
    cantidad: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    costo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  mensajeGeneracion = '';
  errorGeneracion = '';
  detalleMensaje = '';
  detalleError = '';
  isGenerando = false;
  insertandoDetalle = false;
  resultadoTraspaso: NuevoTraspasoMetadata | null = null;
  detalleTraspaso: DetalleTraspasoItem[] = [];
  cargandoDetalle = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onGenerarTraspaso(): void {
    this.resetMensajes();
    if (this.traspasoForm.invalid) {
      this.traspasoForm.markAllAsTouched();
      this.errorGeneracion = 'Completa el origen, destino y referencia.';
      return;
    }

    if (this.traspasoForm.value.origen === this.traspasoForm.value.destino) {
      this.errorGeneracion = 'El origen y el destino deben ser diferentes.';
      return;
    }

    const payload: NuevoTraspasoPayload = {
      SucursalOrigen: Number(this.traspasoForm.value.origen),
      SucursalDestino: Number(this.traspasoForm.value.destino),
      Usuario: this.usuarioId,
      Referencia: (this.traspasoForm.value.referencia ?? '').trim(),
    };

    if (!payload.Referencia) {
      this.errorGeneracion = 'Ingresa una referencia válida.';
      return;
    }

    this.isGenerando = true;
    this.traspasosService.generarTraspaso(payload).subscribe({
      next: (data) => {
        this.resultadoTraspaso = data;
        this.mensajeGeneracion = `Traspaso generado. Folio entrada ${data.FolioEntrada}, folio salida ${data.FolioSalida}.`;
        this.cargarDetalleTraspaso(data.IdSalida);
        this.isGenerando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.errorGeneracion = error?.message ?? 'No se pudo generar el traspaso.';
        this.isGenerando = false;
        this.markForCheck();
      },
    });
  }

  onAgregarRenglon(): void {
    this.detalleMensaje = '';
    this.detalleError = '';
    if (this.detalleForm.invalid) {
      this.detalleForm.markAllAsTouched();
      this.detalleError = 'Completa la información del renglón.';
      return;
    }

    if (!this.resultadoTraspaso) {
      this.detalleError = 'Primero genera el traspaso para obtener los folios.';
      return;
    }

    const { codigo, descripcion, cantidad, costo } = this.detalleForm.getRawValue();
    if (!codigo || !descripcion || !cantidad || !costo) {
      this.detalleError = 'Completa la información del renglón.';
      return;
    }

    const origen = Number(this.traspasoForm.value.origen);
    const destino = Number(this.traspasoForm.value.destino);
    if (!origen || !destino) {
      this.detalleError = 'Selecciona el origen y destino del traspaso.';
      return;
    }

    const payload: InsertRenglonTraspasoPayload = {
      FolioSalida: this.resultadoTraspaso.FolioSalida,
      IdSalida: this.resultadoTraspaso.IdSalida,
      FolioEntrada: this.resultadoTraspaso.FolioEntrada,
      IdEntrada: this.resultadoTraspaso.IdEntrada,
      Codigo: codigo,
      Cantidad: Number(cantidad),
      Origen: origen,
      Destino: destino,
    };

    this.insertandoDetalle = true;
    this.traspasosService.insertarRenglonTraspaso(payload).subscribe({
      next: () => {
        this.detalleMensaje = 'Renglón agregado al traspaso.';
        this.insertandoDetalle = false;
        this.detalleForm.reset({
          codigo: '',
          descripcion: '',
          cantidad: null,
          costo: null,
        });
        this.cargarDetalleTraspaso(this.resultadoTraspaso.IdSalida);
        this.markForCheck();
      },
      error: (error) => {
        this.detalleError = error?.message ?? 'No se pudo agregar el renglón.';
        this.insertandoDetalle = false;
        this.markForCheck();
      },
    });
  }

  onEliminarRenglon(renglon: DetalleTraspasoItem): void {
    // TODO: integrar endpoint de eliminación cuando esté disponible.
    this.detalleTraspaso = this.detalleTraspaso.filter((item) => item !== renglon);
    this.detalleMensaje = 'Renglón eliminado de la vista. Falta integrar la eliminación en backend.';
    this.markForCheck();
  }

  private cargarDetalleTraspaso(idSalida: number): void {
    this.cargandoDetalle = true;
    this.detalleError = '';
    this.traspasosService.obtenerDetalleTraspaso(idSalida).subscribe({
      next: (detalle) => {
        this.detalleTraspaso = detalle;
        this.cargandoDetalle = false;
        this.markForCheck();
      },
      error: (error) => {
        this.detalleError = error?.message ?? 'No se pudo cargar el detalle.';
        this.cargandoDetalle = false;
        this.markForCheck();
      },
    });
  }

  private resetMensajes(): void {
    this.mensajeGeneracion = '';
    this.errorGeneracion = '';
    this.resultadoTraspaso = null;
    this.detalleTraspaso = [];
    this.detalleMensaje = '';
    this.detalleError = '';
    this.markForCheck();
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
