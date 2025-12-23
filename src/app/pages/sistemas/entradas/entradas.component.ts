import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NbToastrService } from '@nebular/theme';
import { environment } from '../../../../environments/environment';

interface ValoresEntradaResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: {
      ClaveProveedor: string;
      NombreProveedor: string;
      NombreSucursal: string;
      IdSucursal: number;
      OrdenCompra: number;
      NumeroNota: string;
      Entrada: number;
      Importe: number;
      Factura: string;
      IdEstatus: number;
      Estatus: string;
      Permite: number;
    };
  };
}

interface RenglonEntrada {
  Entrada: number;
  Renglon: number;
  Cantidad: number;
  Costo: number;
  CostoFactura: number;
  CostoRenglon: number;
  Codigo: string;
  Descripcion: string;
  UnidadMedida: string;
  CostoOrden: number;
  id: number;
  Descuento: number;
  SC: string;
}

interface EditableRenglonCampos {
  costoFactura: string;
  cantidad: string;
}

interface UpdateRenglonResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: boolean;
  };
}

type CampoEditable = 'CostoFactura' | 'Cantidad';

@Component({
  selector: 'ngx-entradas',
  templateUrl: './entradas.component.html',
  styleUrls: ['./entradas.component.scss'],
})
 

export class EntradasComponent {
  constructor(private http: HttpClient, private toastr: NbToastrService) {}

  // Form model
  facturaMarcada = true;
  notaEntrada = '';
  proveedor = '';
  claveProveedor = '';
  orden = 0;
  tasaRetencion = 0;
  montoRetIva = 0;
  iva = 0;
  ieps = 0;
  descuento = 0;
  factura = '';
  subtotal = 0;
  tasaRetencionIva = 0;
  total = 0;
  sucursal = '';
  estatus = '';
  entrada = 0;
  idSucursal = 0;
  saving = false;
  // Tabla de renglones
  renglones: RenglonEntrada[] = [];
  edicionesRenglones: Record<number, EditableRenglonCampos> = {};
  actualizandoRenglones: Record<number, boolean> = {};

  // Filtro y ordenamiento
  filtro = '';
  sortCol: keyof RenglonEntrada | '' = '';
  sortDir: 'asc' | 'desc' = 'asc';

  get filasMostradas(): RenglonEntrada[] {
    const term = (this.filtro || '').toLowerCase();
    const filtered = term
      ? this.renglones.filter(r =>
          (r.Codigo || '').toLowerCase().includes(term) ||
          (r.Descripcion || '').toLowerCase().includes(term) ||
          (r.UnidadMedida || '').toLowerCase().includes(term),
        )
      : this.renglones.slice();

    if (!this.sortCol) return filtered;

    const dir = this.sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a: any, b: any) => {
      const va = a[this.sortCol as string];
      const vb = b[this.sortCol as string];
      const na = typeof va === 'number' ? va : ('' + (va ?? '')).toLowerCase();
      const nb = typeof vb === 'number' ? vb : ('' + (vb ?? '')).toLowerCase();
      if (na < nb) return -1 * dir;
      if (na > nb) return 1 * dir;
      return 0;
    });
  }

  changeSort(col: keyof EntradasComponent['renglones'][number]) {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
  }

  sortIcon(col: keyof EntradasComponent['renglones'][number]) {
    if (this.sortCol !== col) return 'swap-outline';
    return this.sortDir === 'asc' ? 'arrow-upward-outline' : 'arrow-downward-outline';
  }

  trackByRenglon = (_: number, r: RenglonEntrada) => r.Renglon;

  isRenglonActualizando(renglonId: number): boolean {
    return !!this.actualizandoRenglones[renglonId];
  }

  onNotaEnter(): void {
    const nota = (this.notaEntrada || '').trim();
    if (!nota) {
      return;
    }
    const params = new HttpParams()
      .set('nota', nota)
      .set('tipo', '2');

    this.http
      .get<ValoresEntradaResponse>(`${environment.apiBase}/GetValoresEntrada`, { params })
      .subscribe({
        next: (res) => {
          if (!res?.success || res.StatusCode !== 200) {
            // Keep it simple for now
            console.warn('Respuesta no exitosa', res);
            return;
          }
          const d = res.response?.data;
          if (!d) return;

          this.claveProveedor = d.ClaveProveedor || '';
          this.proveedor = d.NombreProveedor || '';
          this.sucursal = d.NombreSucursal || '';
          this.idSucursal = d.IdSucursal || 0;
          this.orden = d.OrdenCompra || 0;
          this.notaEntrada = d.NumeroNota || nota;
          this.entrada = d.Entrada || 0;
          this.subtotal = d.Importe ?? 0;
          this.total = d.Importe ?? 0;
          this.factura = d.Factura || '';
          this.estatus = d.Estatus || '';
          this.facturaMarcada = !!this.factura;

          // Cargar renglones para la tabla
          this.cargarRenglones(this.notaEntrada);
        },
        error: (err) => {
          console.error('Error obteniendo valores de entrada', err);
        },
      });
  }

  private cargarRenglones(nota: string): void {
    const params = new HttpParams().set('nota', nota);
    this.http
      .get<{ StatusCode: number; success: boolean; response?: { data?: any[] } }>(
        `${environment.apiBase}/GetRenglonesEntrada`,
        { params },
      )
      .subscribe({
        next: (res) => {
          if (!res?.success || res.StatusCode !== 200) {
            console.warn('Renglones no exitoso', res);
            this.renglones = [];
            this.sincronizarCamposEditables();
            return;
          }
          this.renglones = (res.response?.data as RenglonEntrada[]) || [];
          this.sincronizarCamposEditables();
        },
        error: (err) => {
          console.error('Error obteniendo renglones', err);
          this.renglones = [];
          this.sincronizarCamposEditables();
        },
      });
  }

  onCostoFacturaBlur(renglon: RenglonEntrada): void {
    const buffer = this.obtenerBufferEditable(renglon);
    const parsed = this.parseDecimalInput(buffer.costoFactura);
    if (parsed === null) {
      this.toastr.warning('Ingresa un costo de factura válido', 'Aviso');
      buffer.costoFactura = this.formatearNumeroEditable(renglon.CostoFactura);
      return;
    }

    if (this.isSameNumber(renglon.CostoFactura, parsed)) {
      buffer.costoFactura = this.formatearNumeroEditable(parsed);
      return;
    }

    const valorAnterior = renglon.CostoFactura;
    this.aplicarCambiosRenglon(renglon, { CostoFactura: parsed });
    buffer.costoFactura = this.formatearNumeroEditable(parsed);
    this.notificarEdicion(renglon, 'CostoFactura', parsed, valorAnterior);
  }

  onCantidadBlur(renglon: RenglonEntrada): void {
    const buffer = this.obtenerBufferEditable(renglon);
    const parsed = this.parseDecimalInput(buffer.cantidad);
    if (parsed === null) {
      this.toastr.warning('Ingresa una cantidad válida', 'Aviso');
      buffer.cantidad = this.formatearNumeroEditable(renglon.Cantidad);
      return;
    }

    if (this.isSameNumber(renglon.Cantidad, parsed)) {
      buffer.cantidad = this.formatearNumeroEditable(parsed);
      return;
    }

    const valorAnterior = renglon.Cantidad;
    this.aplicarCambiosRenglon(renglon, { Cantidad: parsed });
    buffer.cantidad = this.formatearNumeroEditable(parsed);
    this.notificarEdicion(renglon, 'Cantidad', parsed, valorAnterior);
  }

  private sincronizarCamposEditables(): void {
    const buffers: Record<number, EditableRenglonCampos> = {};
    this.renglones.forEach((r) => {
      buffers[r.Renglon] = {
        costoFactura: this.formatearNumeroEditable(r.CostoFactura),
        cantidad: this.formatearNumeroEditable(r.Cantidad),
      };
    });
    this.edicionesRenglones = buffers;
    this.actualizandoRenglones = {};
  }

  private obtenerBufferEditable(renglon: RenglonEntrada): EditableRenglonCampos {
    if (!this.edicionesRenglones[renglon.Renglon]) {
      this.edicionesRenglones[renglon.Renglon] = {
        costoFactura: this.formatearNumeroEditable(renglon.CostoFactura),
        cantidad: this.formatearNumeroEditable(renglon.Cantidad),
      };
    }
    return this.edicionesRenglones[renglon.Renglon];
  }

  private formatearNumeroEditable(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) {
      return '';
    }
    return `${valor}`;
  }

  private parseDecimalInput(value: string | null | undefined): number | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = value.replace(/\s+/g, '').replace(/,/g, '.');
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private aplicarCambiosRenglon(renglon: RenglonEntrada, cambios: Partial<RenglonEntrada>): void {
    Object.assign(renglon, cambios);
    renglon.CostoRenglon = this.recalcularTotalRenglon(renglon);
  }

  private recalcularTotalRenglon(renglon: RenglonEntrada): number {
    const costoBase = (renglon.CostoFactura ?? renglon.Costo ?? 0);
    const cantidad = renglon.Cantidad ?? 0;
    const total = costoBase * cantidad;
    return Number.isFinite(total) ? total : 0;
  }

  private isSameNumber(actual: number | null | undefined, incoming: number): boolean {
    return Math.abs((actual ?? 0) - incoming) < 0.0001;
  }

  private setEstadoActualizacion(renglonId: number, estado: boolean): void {
    if (estado) {
      this.actualizandoRenglones[renglonId] = true;
    } else {
      delete this.actualizandoRenglones[renglonId];
    }
  }

  private numeroParaApi(valor: number | null | undefined): string {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? numero.toFixed(2) : '0.00';
  }

  private crearPayloadActualizacion(renglon: RenglonEntrada) {
    return {
      Costo: this.numeroParaApi(renglon.CostoFactura),
      Cantidad: this.numeroParaApi(renglon.Cantidad),
      Id: String(renglon.id ?? renglon.Renglon ?? ''),
      Descuento: this.numeroParaApi(renglon.Descuento),
    };
  }

  private revertirEdicionRenglon(renglon: RenglonEntrada, campo: CampoEditable, valorAnterior: number): void {
    if (campo === 'CostoFactura') {
      this.aplicarCambiosRenglon(renglon, { CostoFactura: valorAnterior });
      const buffer = this.obtenerBufferEditable(renglon);
      buffer.costoFactura = this.formatearNumeroEditable(valorAnterior);
    } else {
      this.aplicarCambiosRenglon(renglon, { Cantidad: valorAnterior });
      const buffer = this.obtenerBufferEditable(renglon);
      buffer.cantidad = this.formatearNumeroEditable(valorAnterior);
    }
  }

  private notificarEdicion(
    renglon: RenglonEntrada,
    campo: CampoEditable,
    valor: number,
    valorAnterior: number | null | undefined,
  ): void {
    const renglonId = renglon.Renglon;
    this.setEstadoActualizacion(renglonId, true);
    const payload = this.crearPayloadActualizacion(renglon);

    this.http
      .post<UpdateRenglonResponse>(`${environment.apiBase}/UpdateRenglonEntrada`, payload)
      .subscribe({
        next: (res) => {
          const ok = res?.success && res.StatusCode === 200 && res.response?.data === true;
          if (!ok) {
            this.toastr.danger('No fue posible actualizar el renglón', 'Error');
            this.revertirEdicionRenglon(renglon, campo, valorAnterior ?? valor);
          }
        },
        error: (err) => {
          console.error('Error actualizando renglón', err);
          this.toastr.danger('Error de comunicación al actualizar el renglón', 'Error');
          this.revertirEdicionRenglon(renglon, campo, valorAnterior ?? valor);
          this.setEstadoActualizacion(renglonId, false);
        },
        complete: () => {
          this.setEstadoActualizacion(renglonId, false);
        },
      });
  }

  guardar(): void {
    const body = {
      Folio: '0',
      IdSucursal: String(this.idSucursal || 0),
      Tipo: '',
      Referencia: this.notaEntrada || '',
      IsFactura: this.facturaMarcada ? '1' : '0',
      Usuario: '1',
    };

    if (!body.Referencia) {
      this.toastr.warning('Captura la Nota de Entrada antes de guardar', 'Aviso');
      return;
    }

    this.saving = true;
    this.http
      .post<{ StatusCode: number; success: boolean; response?: { data?: boolean } }>(
        `${environment.apiBase}/UpdateExistenciasMov`,
        body,
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res.StatusCode === 200 && res.response?.data === true) {
            this.toastr.success('Entrada guardada correctamente', 'Éxito');
          } else {
            this.toastr.danger('No fue posible guardar la entrada', 'Error');
          }
        },
        error: (err) => {
          console.error('Error al guardar', err);
          this.toastr.danger('Error de comunicación con el servidor', 'Error');
        },
        complete: () => {
          this.saving = false;
        },
      });
  }
}
