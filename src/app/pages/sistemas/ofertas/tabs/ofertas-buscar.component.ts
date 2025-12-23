import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface OfertaItem {
  Oferta: number;
  Descripcion: string;
  FechaInicial: string;
  FechaFinal: string;
  Tipo: number;
  Descuento: number;
  Dias: string | null;
  Sucursales: string | null;
}

interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message?: string;
  response?: {
    data?: T[];
  };
}

@Component({
  selector: 'ngx-ofertas-buscar',
  template: `
    <div class="row">
      <div class="col-12">
        <nb-card>
          <nb-card-body>
            <form (submit)="$event.preventDefault()" class="mb-2">
              <div class="row">
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="label">*Sucursal:</label>
                    <input nbInput fullWidth type="text" [(ngModel)]="sucursal" name="sucursal" />
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="label">*Fecha Inicial:</label>
                    <input nbInput fullWidth type="date" [(ngModel)]="fechaIni" name="fechaIni" />
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="label">*Fecha Final:</label>
                    <input nbInput fullWidth type="date" [(ngModel)]="fechaFin" name="fechaFin" />
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label class="label">*Código:</label>
                    <input nbInput fullWidth type="text" [(ngModel)]="codigo" name="codigo" />
                  </div>
                </div>
                <div class="col-md-1 d-flex align-items-end justify-content-end">
                  <button nbButton status="danger" (click)="buscar()" [disabled]="loading">{{ loading ? 'Buscando…' : 'Buscar' }}</button>
                </div>
              </div>
            </form>

            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th style="width: 80px">Oferta</th>
                    <th>Descripción</th>
                    <th style="width: 140px">Fecha Inicial</th>
                    <th style="width: 140px">Fecha Final</th>
                    <th style="width: 80px">Tipo</th>
                    <th style="width: 110px">Descuento</th>
                    <th>Sucursales</th>
                    <th style="width: 260px">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="!loading && (!items || items.length === 0)">
                    <td colspan="8" class="text-center text-muted">Sin resultados</td>
                  </tr>
                  <tr *ngFor="let it of items">
                    <td>{{ it.Oferta }}</td>
                    <td>{{ it.Descripcion }}</td>
                    <td>{{ it.FechaInicial }}</td>
                    <td>{{ it.FechaFinal }}</td>
                    <td>{{ it.Tipo }}</td>
                    <td>{{ it.Descuento | number: '1.2-2' }}</td>
                    <td>{{ it.Sucursales || '—' }}</td>
                    <td>
                      <button nbButton size="tiny" status="danger" class="mr-2" (click)="detalle(it)">Detalle</button>
                      <button nbButton size="tiny" status="danger" class="mr-2" (click)="eliminar(it)">Eliminar</button>
                      <button nbButton size="tiny" status="danger" (click)="etiquetas(it)">Etiquetas</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </nb-card-body>
        </nb-card>
      </div>
    </div>
  `,
})
export class OfertasBuscarComponent {
  constructor(private http: HttpClient) {}

  sucursal = '';
  fechaIni = '';
  fechaFin = '';
  codigo = '';
  loading = false;
  items: OfertaItem[] = [];

  buscar() {
    if (!this.sucursal.trim() || !this.fechaIni || !this.fechaFin || !this.codigo.trim()) {
      // Campos requeridos; imitar UI original que exige todos con asterisco
      this.items = [];
      return;
    }

    this.loading = true;
    const payload = {
      sucursal: this.sucursal.trim(),
      codigo: this.codigo.trim(),
      fecha_inicial: this.fechaIni,
      fecha_final: this.fechaFin,
    };

    this.http
      .post<ApiResponse<OfertaItem>>(
        `${environment.apiBase}/GetOfertasActivasArticulo`,
        payload,
      )
      .subscribe({
        next: (res) => {
          const ok = res?.success === true && res?.StatusCode === 200;
          const payloadData = (ok ? res.response?.data : res?.response?.data) ?? [];
          this.items = Array.isArray(payloadData) ? payloadData : [];
        },
        error: () => {
          this.items = [];
        },
        complete: () => (this.loading = false),
      });
  }

  detalle(it: OfertaItem) { console.log('Detalle', it); }
  eliminar(it: OfertaItem) { console.log('Eliminar', it); }
  etiquetas(it: OfertaItem) { console.log('Etiquetas', it); }
}
