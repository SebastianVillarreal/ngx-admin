import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbCardModule, NbInputModule, NbButtonModule } from '@nebular/theme';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface OfertaActiva {
  Id: number;
  Descripcion: string;
  FechaInicio: string; // ISO o dd/MM/yyyy
  FechaFin: string;    // ISO o dd/MM/yyyy
}

interface PagedResponse<T> {
  StatusCode?: number;
  success?: boolean;
  response?: {
    data?: T[];
    total?: number;
  };
}

@Component({
  selector: 'ngx-ofertas-activas',
  standalone: true,
  imports: [CommonModule, FormsModule, NbCardModule, NbInputModule, NbButtonModule],
  styles: [`
  .search-box { display: flex; align-items: center; }
  .paginator button { margin: 0 0.25rem; }
  .table td, .table th { vertical-align: middle; }
  `],
  template: `
  <div class="row">
    <div class="col-12">
      <nb-card>
        <nb-card-header class="d-flex align-items-center justify-content-between">
          <span>Ofertas Activas</span>
          <div class="search-box">
            <label class="mr-2">Buscar:</label>
            <input nbInput placeholder="" [(ngModel)]="search" (keyup)="onSearchKeyup()" />
          </div>
        </nb-card-header>
        <nb-card-body>
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
                  <td colspan="5" class="text-center text-muted">Sin registros</td>
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

          <div class="d-flex align-items-center justify-content-between mt-2">
            <div class="text-muted">
              Mostrando registros del {{ showingFrom }} al {{ showingTo }} de un total de {{ total }} registros
            </div>
            <div class="paginator">
              <button nbButton size="tiny" ghost (click)="prev()" [disabled]="page === 1">Anterior</button>
              <button nbButton size="tiny" [status]="page === p ? 'primary' : 'basic'" *ngFor="let p of [].constructor(totalPages); let i = index" (click)="goto(i+1)">{{ i + 1 }}</button>
              <button nbButton size="tiny" ghost (click)="next()" [disabled]="page === totalPages">Siguiente</button>
            </div>
          </div>
        </nb-card-body>
      </nb-card>
    </div>
  </div>
  `,
})
export class OfertasActivasComponent {
  constructor(private http: HttpClient) {
    this.load();
  }

  // Filtro y paginación
  search = '';
  page = 1;
  pageSize = 10;
  total = 0;

  items: OfertaActiva[] = [];
  loading = false;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get showingFrom(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }
  get showingTo(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  private load() {
    this.loading = true;
    const params = new HttpParams()
      .set('page', String(this.page))
      .set('pageSize', String(this.pageSize))
      .set('q', this.search || '');

    this.http
      .get<PagedResponse<OfertaActiva>>(`${environment.apiBase}/Ofertas/Activas`, { params })
      .subscribe({
        next: (res) => {
          if (res?.success === true && res.StatusCode === 200) {
            this.items = res.response?.data || [];
            this.total = res.response?.total ?? this.items.length;
          } else {
            // Fallback simple si el API aún no está
            this.items = (res?.response?.data as any) || [];
            this.total = this.items.length;
          }
        },
        error: () => {
          // Fallback: sin API, dejamos lista vacía
          this.items = [];
          this.total = 0;
        },
        complete: () => (this.loading = false),
      });
  }

  onSearchKeyup() {
    this.page = 1;
    this.load();
  }

  goto(page: number) {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  prev() { this.goto(this.page - 1); }
  next() { this.goto(this.page + 1); }

  detalle(oferta: OfertaActiva) {
    // Pendiente: abrir modal o navegar a detalle
    console.log('Detalle', oferta);
  }

  eliminar(oferta: OfertaActiva) {
    // Pendiente: confirmación y borrado
    console.log('Eliminar', oferta);
  }

  etiquetas(oferta: OfertaActiva) {
    // Pendiente: acción de etiquetas
    console.log('Etiquetas', oferta);
  }
}
