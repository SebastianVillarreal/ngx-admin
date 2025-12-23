import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbToastrService } from '@nebular/theme';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface SolicitudGeneralForm {
  sucursal: string;
  descripcion: string;
}

interface SolicitudDetalleForm {
  folio: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
}

interface SolicitudDetalleRegistro extends SolicitudDetalleForm {
  estado: 'Pendiente' | 'En proceso' | 'Finalizado';
  fecha: Date;
}

interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: T;
  };
}

@Component({
  selector: 'ngx-solicitud-etiquets',
  templateUrl: './solicitud-de-etiquets.component.html',
  styleUrls: ['./solicitud-de-etiquets.component.scss'],
})
export class SolicitudEtiquetsComponent {
  private folioCounter = 4200;

  readonly sucursales = ['Matriz', 'Norte', 'Centro', 'Sur'];
  solicitudGeneral: SolicitudGeneralForm = this.crearSolicitudGeneral();
  detalle: SolicitudDetalleForm = this.crearDetalleForm();
  detalles: SolicitudDetalleRegistro[] = [];
  guardando = false;
  guardandoDetalle = false;

  constructor(private toastr: NbToastrService, private http: HttpClient) {}

  guardarSolicitud(form: NgForm): void {
    if (form.invalid) {
      this.toastr.warning('Completa los campos marcados con *', 'Aviso');
      return;
    }

    const payload = {
      Descripcion: (this.solicitudGeneral.descripcion || '').trim(),
      IdSucursal: this.obtenerSucursalId(this.solicitudGeneral.sucursal),
      IdUsuario: '1',
    };

    this.guardando = true;
    this.http
      .post<ApiResponse<number>>(
        `${environment.apiBase}/InsertarFolioSolicitudEtiquetas`,
        payload,
      )
      .subscribe({
        next: (res) => {
          const folioGenerado = res?.response?.data;
          const ok = res?.success && res.StatusCode === 200 && folioGenerado !== undefined;
          if (!ok) {
            this.toastr.danger('No fue posible generar el folio', 'Error');
            return;
          }
          this.detalle.folio = String(folioGenerado);
          this.toastr.success('Folio generado correctamente', 'Éxito');
        },
        error: (err) => {
          console.error('Error InsertarFolioSolicitudEtiquetas', err);
          this.toastr.danger('Error de comunicación al generar folio', 'Error');
          this.guardando = false;
        },
        complete: () => {
          this.guardando = false;
        },
      });
  }

  finalizarSolicitud(form: NgForm): void {
    if (!this.detalles.length) {
      this.toastr.warning('Captura al menos un detalle antes de finalizar', 'Aviso');
      return;
    }

    this.toastr.success('Solicitud finalizada correctamente', 'Éxito');
    this.detalles = [];
    this.solicitudGeneral = this.crearSolicitudGeneral();
    form.resetForm(this.solicitudGeneral);
    this.detalle = this.crearDetalleForm();
  }

  guardarDetalle(form: NgForm): void {
    if (form.invalid) {
      this.toastr.warning('Completa la información del detalle', 'Aviso');
      return;
    }

    if (!this.detalle.folio) {
      this.toastr.warning('Genera un folio antes de capturar detalles', 'Aviso');
      return;
    }

    const payload = {
      Codigo: (this.detalle.codigo || '').trim(),
      IdFolio: String(this.detalle.folio),
      Descripcion: (this.detalle.descripcion || '').trim(),
      Cantidad: String(this.detalle.cantidad ?? 0),
    };

    this.guardandoDetalle = true;
    this.http
      .post<ApiResponse<number>>(
        `${environment.apiBase}/InsertarDetalleFolioSolicitud`,
        payload,
      )
      .subscribe({
        next: (res) => {
          const ok = res?.success && res.StatusCode === 200 && res.response?.data === 1;
          if (!ok) {
            this.toastr.danger('No fue posible guardar el detalle', 'Error');
            return;
          }

          const registro: SolicitudDetalleRegistro = {
            ...this.detalle,
            estado: 'Pendiente',
            fecha: new Date(),
          };

          this.detalles = [...this.detalles, registro];
          this.toastr.success('Detalle agregado', 'Éxito');
          const folioActual = this.detalle.folio;
          this.detalle = this.crearDetalleForm(folioActual);
          form.resetForm(this.detalle);
        },
        error: (err) => {
          console.error('Error InsertarDetalleFolioSolicitud', err);
          this.toastr.danger('Error de comunicación al guardar el detalle', 'Error');
          this.guardandoDetalle = false;
        },
        complete: () => {
          this.guardandoDetalle = false;
        },
      });
  }

  trackByFolio = (_: number, registro: SolicitudDetalleRegistro) => registro.folio;

  private crearSolicitudGeneral(): SolicitudGeneralForm {
    return {
      sucursal: this.sucursales[0],
      descripcion: '',
    };
  }

  private crearDetalleForm(folio?: string): SolicitudDetalleForm {
    return {
      folio: folio ?? this.generarFolio(),
      codigo: '',
      descripcion: '',
      cantidad: 1,
    };
  }

  private generarFolio(): string {
    this.folioCounter += 1;
    return `SET-${this.folioCounter}`;
  }

  private obtenerSucursalId(nombre: string): string {
    const index = this.sucursales.indexOf(nombre);
    return index >= 0 ? String(index + 1) : '1';
  }
}
