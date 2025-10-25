import { Component } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Sucursal { id: number; nombre: string; }
interface HistItem { Id: number; Descripcion: string; FechaInicio: string; FechaFin: string; }

@Component({
  selector: 'ngx-ofertas-historico',
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
                    <nb-select fullWidth placeholder="Seleccione..." [(selected)]="sucursalId" [disabled]="cargandoSucursales">
                      <nb-option *ngFor="let s of sucursales" [value]="s.id">{{ s.nombre }}</nb-option>
                    </nb-select>
                  </div>
                </div>
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
export class OfertasHistoricoComponent {
  constructor(private http: HttpClient) { this.cargarSucursales(); }

  sucursalId: number | null = null;
  sucursales: Sucursal[] = [];
  cargandoSucursales = false;
  fechaIni = '';
  fechaFin = '';
  loading = false;
  items: HistItem[] = [];

  private cargarSucursales() {
    this.cargandoSucursales = true;
    this.http.get<{ response?: { data?: Array<{ IdSucursal: number; Nombre: string }> } }>(`${environment.apiBase}/GetSucursales`)
      .subscribe({
        next: (res) => {
          const data = res?.response?.data || [];
          this.sucursales = data.map(s => ({ id: s.IdSucursal, nombre: s.Nombre }));
        },
        error: () => {},
        complete: () => this.cargandoSucursales = false,
      });
  }

  buscar() {
    if (!this.sucursalId || !this.fechaIni || !this.fechaFin) {
      this.items = [];
      return;
    }
    this.loading = true;
    const params = new HttpParams()
      .set('sucursalId', String(this.sucursalId))
      .set('fechaIni', this.fechaIni)
      .set('fechaFin', this.fechaFin);

    this.http.get<{ response?: { data?: HistItem[] } }>(`${environment.apiBase}/Ofertas/Historico`, { params })
      .subscribe({
        next: (res) => this.items = res?.response?.data || [],
        error: () => this.items = [],
        complete: () => this.loading = false,
      });
  }

  detalle(it: HistItem) { console.log('Detalle', it); }
  eliminar(it: HistItem) { console.log('Eliminar', it); }
  etiquetas(it: HistItem) { console.log('Etiquetas', it); }
}
