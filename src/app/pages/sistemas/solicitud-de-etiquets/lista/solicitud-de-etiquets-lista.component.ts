import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { environment } from '../../../../../environments/environment';

interface SolicitudResumen {
  Id: number;
  Descripcion: string;
  Usuario: string;
  Sucursal: string;
  Estatus: string;
  Fecha: string;
}

interface DetalleFolio {
  Id: number;
  Codigo: string;
  Descripcion: string;
  Cantidad: number;
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
  selector: 'ngx-solicitud-etiquets-lista',
  templateUrl: './solicitud-de-etiquets-lista.component.html',
  styleUrls: ['./solicitud-de-etiquets-lista.component.scss'],
})
export class SolicitudEtiquetsListaComponent implements OnInit {
  solicitudes: SolicitudResumen[] = [];
  loading = false;
  readonly sucursalId = '1';
  @ViewChild('detalleModal', { static: true }) detalleModal!: TemplateRef<any>;
  selectedSolicitud: SolicitudResumen | null = null;
  detallesFolio: DetalleFolio[] = [];
  detalleLoading = false;
  fechaPrecio = '';
  formatoEtiquetas = '';
  readonly formatosDisponibles = ['1', '3', '4', '6', '24', '32', '40'];
  dialogRef: NbDialogRef<any> | null = null;

  constructor(
    private http: HttpClient,
    private toastr: NbToastrService,
    private dialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.loading = true;
    this.http
      .post<ApiResponse<SolicitudResumen[]>>(
        `${environment.apiBase}/GetFoliosEtiquetas`,
        { IdSucursal: this.sucursalId },
      )
      .subscribe({
        next: (res) => {
          const ok = res?.success && res.StatusCode === 200;
          if (!ok || !Array.isArray(res.response?.data)) {
            this.toastr.warning('No se pudieron cargar las solicitudes', 'Aviso');
            this.solicitudes = [];
            return;
          }
          this.solicitudes = res.response?.data ?? [];
        },
        error: (err) => {
          console.error('Error GetFoliosEtiquetas', err);
          this.toastr.danger('Error de comunicación al consultar folios', 'Error');
          this.solicitudes = [];
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  abrirDetalle(solicitud: SolicitudResumen): void {
    this.selectedSolicitud = solicitud;
    this.detallesFolio = [];
    this.detalleLoading = false;
    this.fechaPrecio = this.obtenerFechaDefault();
    this.formatoEtiquetas = '';
    this.dialogRef = this.dialogService.open(this.detalleModal, {
      closeOnBackdropClick: true,
      hasScroll: true,
    });
    this.cargarDetalleFolio(solicitud.Id);
  }

  private cargarDetalleFolio(folioId: number): void {
    this.detalleLoading = true;
    this.http
      .post<ApiResponse<DetalleFolio[]>>(
        `${environment.apiBase}/GetDetalleFolioEtiquetas`,
        { IdFolio: String(folioId) },
      )
      .subscribe({
        next: (res) => {
          const ok = res?.success && res.StatusCode === 200;
          if (!ok || !Array.isArray(res.response?.data)) {
            this.toastr.warning('No se pudo obtener el detalle del folio', 'Aviso');
            this.detallesFolio = [];
            return;
          }
          this.detallesFolio = res.response.data;
        },
        error: (err) => {
          console.error('Error GetDetalleFolioEtiquetas', err);
          this.toastr.danger('Error al cargar el detalle del folio', 'Error');
          this.detallesFolio = [];
        },
        complete: () => {
          this.detalleLoading = false;
        },
      });
  }

  generarArchivo(ref?: NbDialogRef<any>): void {
    if (!this.selectedSolicitud) {
      return;
    }
    const formato = this.formatoEtiquetas || '(sin formato)';
    this.toastr.success(
      `Archivo generado para folio ${this.selectedSolicitud.Id} (${formato})`,
      'Éxito',
    );
    (ref || this.dialogRef)?.close();
  }

  private obtenerFechaDefault(): string {
    return new Date().toISOString().slice(0, 10);
  }

  onCantidadChange(detalle: DetalleFolio, valor: number): void {
    const cantidad = Number(valor);
    detalle.Cantidad = Number.isFinite(cantidad) ? cantidad : 0;
  }

  trackByFolio = (_: number, item: SolicitudResumen) => item.Id;
}
