import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { environment } from '../../../../../environments/environment';

interface IepsEspecialItem {
  Id: number;
  Articulo: string;
  Descripcion: string;
  IepsEspecial: number;
  Ieps: number;
  Iva: number;
  Costo: number;
  PorcentajeAlcohol: number;
  Familia: string;
}

interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message?: string;
  response?: {
    data?: T[];
  };
}

type SortColumn =
  | 'Id'
  | 'Articulo'
  | 'Descripcion'
  | 'IepsEspecial'
  | 'Ieps'
  | 'Iva'
  | 'Costo'
  | 'PorcentajeAlcohol'
  | 'Familia';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-ieps-especial-crud',
  templateUrl: './ieps-especial-crud.component.html',
  styleUrls: ['./ieps-especial-crud.component.scss'],
})
export class IepsEspecialCrudComponent implements OnInit {
  readonly insertEndpoint = `${environment.apiBase}/InsertArticuloIepsEspecial`;

  items: IepsEspecialItem[] = [];
  displayItems: IepsEspecialItem[] = [];
  paginatedItems: IepsEspecialItem[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Id';
  sortDirection: SortDirection = 'asc';

  pageSizeOptions = [10, 25, 50, 100];
  pageSize = 10;
  currentPage = 1;

  isEditing = false;
  saving = false;
  formError = '';
  selectedId: number | null = null;
  form = {
    Articulo: '',
    PorcentajeAlcohol: '',
    Margen: '',
    Ieps: '',
    Unidad: '',
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.cargarArticulos();
  }

  retry(): void {
    this.cargarArticulos();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyTransforms();
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyTransforms();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.paginate();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.paginate();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.paginate();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayItems.length / this.pageSize));
  }

  get pageStart(): number {
    if (!this.displayItems.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (!this.displayItems.length) {
      return 0;
    }
    return Math.min(this.currentPage * this.pageSize, this.displayItems.length);
  }

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      Id: item.Id,
      Articulo: item.Articulo,
      Descripcion: item.Descripcion,
      IepsEspecial: item.IepsEspecial,
      Ieps: item.Ieps,
      Iva: item.Iva,
      Costo: item.Costo,
      PorcentajeAlcohol: item.PorcentajeAlcohol,
      Familia: item.Familia,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IepsEspecial');
    XLSX.writeFile(workbook, 'ieps-especial-crud.xlsx');
  }

  trackById(_: number, item: IepsEspecialItem): number {
    return item.Id;
  }

  nuevo(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.formError = '';
    this.form = {
      Articulo: '',
      PorcentajeAlcohol: '',
      Margen: '',
      Ieps: '',
      Unidad: '',
    };
  }

  editar(item: IepsEspecialItem): void {
    this.isEditing = true;
    this.selectedId = item.Id;
    this.formError = '';
    this.form = {
      Articulo: item.Articulo ? String(item.Articulo) : '',
      PorcentajeAlcohol: String(item.PorcentajeAlcohol ?? ''),
      Margen: String(item.IepsEspecial ?? ''),
      Ieps: String(item.Ieps ?? ''),
      Unidad: String(item.Iva ?? ''),
    };
  }

  eliminar(item: IepsEspecialItem): void {
    // Placeholder de vista CRUD para futura eliminación
    console.log('Eliminar', item);
  }

  cancelarEdicion(): void {
    this.nuevo();
  }

  guardar(): void {
    this.formError = '';

    if (!this.form.Articulo.trim()) {
      this.formError = 'Captura el artículo.';
      return;
    }
    if (!this.form.PorcentajeAlcohol.trim()) {
      this.formError = 'Captura el porcentaje de alcohol.';
      return;
    }
    if (!this.form.Margen.trim()) {
      this.formError = 'Captura el margen.';
      return;
    }
    if (!this.form.Ieps.trim()) {
      this.formError = 'Captura el IEPS.';
      return;
    }
    if (!this.form.Unidad.trim()) {
      this.formError = 'Captura la unidad.';
      return;
    }

    const payload = {
      Articulo: this.form.Articulo.trim(),
      PorcentajeAlcohol: this.form.PorcentajeAlcohol.trim(),
      Margen: this.form.Margen.trim(),
      Ieps: this.form.Ieps.trim(),
      Unidad: this.form.Unidad.trim(),
    };

    this.saving = true;
    this.http.post<ApiResponse<unknown>>(this.insertEndpoint, payload).subscribe({
      next: (res) => {
        const ok = res?.success === true || res?.StatusCode === 200;
        if (!ok) {
          this.formError = res?.message || 'No fue posible guardar el registro.';
          return;
        }

        this.nuevo();
        this.cargarArticulos();
      },
      error: () => {
        this.formError = 'No fue posible guardar el registro.';
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  private cargarArticulos(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.http
      .get<ApiResponse<IepsEspecialItem>>(`${environment.apiBase}/GetArticulosIepsEspecial`)
      .subscribe({
        next: (res) => {
          const ok = res?.success === true || res?.StatusCode === 200;
          const rows = ok ? res?.response?.data ?? [] : [];
          this.items = Array.isArray(rows) ? rows : [];
          this.applyTransforms();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo cargar el catálogo de Ieps Especial.';
        },
      });
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const filtered = term
      ? this.items.filter((item) => this.matchesTerm(item, term))
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private matchesTerm(item: IepsEspecialItem, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || (item.Articulo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || String(item.IepsEspecial).toLowerCase().includes(term)
      || String(item.Ieps).toLowerCase().includes(term)
      || String(item.Iva).toLowerCase().includes(term)
      || String(item.Costo).toLowerCase().includes(term)
      || String(item.PorcentajeAlcohol).toLowerCase().includes(term)
      || (item.Familia || '').toLowerCase().includes(term);
  }

  private compareRows(a: IepsEspecialItem, b: IepsEspecialItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;

    const numericColumns: SortColumn[] = ['Id', 'IepsEspecial', 'Ieps', 'Iva', 'Costo', 'PorcentajeAlcohol'];

    if (numericColumns.includes(this.sortColumn)) {
      const result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
      return result * factor;
    }

    const left = String(a[this.sortColumn] || '').toLowerCase();
    const right = String(b[this.sortColumn] || '').toLowerCase();
    return left.localeCompare(right, 'es', { sensitivity: 'base' }) * factor;
  }
}
