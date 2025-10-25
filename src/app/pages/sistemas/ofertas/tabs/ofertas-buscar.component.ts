import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface OfertaItem {
  Id: number;
  Descripcion: string;
  FechaInicio: string;
  FechaFin: string;
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
                <div class="col-md-4">
                  <div class="form-group">
                    <label class="label">*Fecha Inicial:</label>
                    <input nbInput fullWidth type="date" [(ngModel)]="fechaIni" name="fechaIni" />
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label class="label">*Fecha Final:</label>
                    <input nbInput fullWidth type="date" [(ngModel)]="fechaFin" name="fechaFin" />
                  </div>
                </div>
                <div class="col-md-3">
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
                    <th style="width: 80px">#</th>
                    <th>Descripción</th>
                    <th style="width: 160px">Fecha Inicio</th>
                    <th style="width: 160px">Fecha Fin</th>
                    <th style="width: 260px">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="!loading && (!items || items.length === 0)">
                    <td colspan="5" class="text-center text-muted">Sin resultados</td>
                  </tr>
                  <tr *ngFor="let it of items">
                    <td>{{ it.Id }}</td>
                    <td>{{ it.Descripcion }}</td>
                    <td>{{ it.FechaInicio }}</td>
                    <td>{{ it.FechaFin }}</td>
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

  fechaIni = '';
  fechaFin = '';
  codigo = '';
  loading = false;
  items: OfertaItem[] = [];

  buscar() {
    if (!this.fechaIni || !this.fechaFin || !this.codigo.trim()) {
      // Campos requeridos; imitar UI original que exige todos con asterisco
      this.items = [];
      return;
    }

    this.loading = true;
    const params = new HttpParams()
      .set('fechaIni', this.fechaIni)
      .set('fechaFin', this.fechaFin)
      .set('codigo', this.codigo.trim());

    this.http
      .get<{ success?: boolean; StatusCode?: number; response?: { data?: OfertaItem[] } }>(
        `${environment.apiBase}/Ofertas/Buscar`,
        { params },
      )
      .subscribe({
        next: (res) => {
          this.items = res?.response?.data || [];
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
