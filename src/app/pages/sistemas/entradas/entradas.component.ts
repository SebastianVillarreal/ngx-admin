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
  renglones: Array<{
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
  }> = [];

  // Filtro y ordenamiento
  filtro = '';
  sortCol: keyof EntradasComponent['renglones'][number] | '' = '';
  sortDir: 'asc' | 'desc' = 'asc';

  get filasMostradas() {
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

  trackByRenglon = (_: number, r: { Renglon: number }) => r.Renglon;

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
            return;
          }
          this.renglones = (res.response?.data as any[]) || [];
        },
        error: (err) => {
          console.error('Error obteniendo renglones', err);
          this.renglones = [];
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
