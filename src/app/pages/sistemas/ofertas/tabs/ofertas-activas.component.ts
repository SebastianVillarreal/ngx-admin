import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbCardModule, NbInputModule, NbButtonModule } from '@nebular/theme';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface OfertaActiva {
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
  selector: 'ngx-ofertas-activas',
  standalone: true,
  imports: [CommonModule, FormsModule, NbCardModule, NbInputModule, NbButtonModule],
  styles: [`
  .search-box { display: flex; align-items: center; }
  .paginator button { margin: 0 0.25rem; }
  .table td, .table th { vertical-align: middle; }
  `],
  templateUrl: './ofertas-activas.component.html',
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
  private allItems: OfertaActiva[] = [];
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

    this.http
      .post<ApiResponse<OfertaActiva>>(`${environment.apiBase}/GetOfertasActivas`, {})
      .subscribe({
        next: (res) => {
          const ok = res?.success === true && res?.StatusCode === 200;
          const payload = (ok ? res.response?.data : res?.response?.data) ?? [];
          this.allItems = Array.isArray(payload) ? payload : [];
          this.page = 1;
          this.applyFilters();
        },
        error: () => {
          this.allItems = [];
          this.total = 0;
          this.items = [];
          this.loading = false;
        },
        complete: () => (this.loading = false),
      });
  }

  onSearchKeyup() {
    this.page = 1;
    this.applyFilters();
  }

  goto(page: number) {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.applyFilters();
  }

  prev() { this.goto(this.page - 1); }
  next() { this.goto(this.page + 1); }

  private applyFilters() {
    const term = this.search.trim().toLowerCase();
    const filtered = term
      ? this.allItems.filter((item) => this.matchesSearch(item, term))
      : [...this.allItems];

    this.total = filtered.length;
    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.items = filtered.slice(start, start + this.pageSize);
  }

  private matchesSearch(item: OfertaActiva, term: string): boolean {
    const values = [
      `${item.Oferta}`,
      item.Descripcion ?? '',
      item.Sucursales ?? '',
    ].map((val) => val.toString().toLowerCase());

    return values.some((val) => val.includes(term));
  }

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
