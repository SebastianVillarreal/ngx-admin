import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbToastrService } from '@nebular/theme';
import * as XLSX from 'xlsx';
import { environment } from '../../../../environments/environment';

interface FamiliaItem {
  Id: number;
  Nombre: string;
  NombreDepartamento: string;
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
  selector: 'ngx-ofertas-porcentaje',
  templateUrl: './ofertas-porcentaje.component.html',
  styleUrls: ['./ofertas-porcentaje.component.scss'],
})
export class OfertasPorcentajeComponent implements OnInit {
  constructor(
    private readonly http: HttpClient,
    private readonly toastr: NbToastrService,
  ) {}

  // Formulario
  idSucursal = '2';
  referencia = '';
  porcentajeDescuento = '';
  fechaInicial = '';
  fechaFinal = '';
  saving = false;

  // Tabla fuente y derivados
  items: FamiliaItem[] = [];
  displayItems: FamiliaItem[] = [];
  paginatedItems: FamiliaItem[] = [];

  // Seleccion de familias
  selectedFamilies: Record<number, boolean> = {};

  // UI tabla
  searchTerm = '';
  sortColumn: keyof FamiliaItem | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  loading = false;
  error = '';

  // Paginacion
  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50, 100];

  ngOnInit(): void {
    this.loadFamilias();
  }

  loadFamilias(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.selectedFamilies = {};

    this.http
      .post<ApiResponse<FamiliaItem>>(`${environment.apiBase}/GetFamilias`, { IdDepartamento: '0' })
      .subscribe({
        next: (res) => {
          const ok = res?.success === true || res?.StatusCode === 200;
          const rows = ok ? res?.response?.data ?? [] : [];
          this.items = Array.isArray(rows) ? rows : [];
          this.items.forEach((item) => {
            this.selectedFamilies[item.Id] = false;
          });
          this.applyFiltersAndSort();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'No fue posible cargar las familias.';
        },
      });
  }

  retry(): void {
    this.loadFamilias();
  }

  onSearch(term: string): void {
    this.searchTerm = term ?? '';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  toggleSort(column: keyof FamiliaItem): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  sortIndicator(column: keyof FamiliaItem): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.buildPage();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.buildPage();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.buildPage();
    }
  }

  get totalPages(): number {
    if (!this.displayItems.length) {
      return 1;
    }
    return Math.ceil(this.displayItems.length / this.pageSize);
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
    return this.pageStart + this.paginatedItems.length - 1;
  }

  trackById(_index: number, item: FamiliaItem): number {
    return item.Id;
  }

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      Departamento: item.NombreDepartamento ?? '',
      Familia: item.Nombre ?? '',
      Seleccionada: this.selectedFamilies[item.Id] ? 'Si' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Familias');
    XLSX.writeFile(workbook, 'ofertas-porcentaje-familias.xlsx');
  }

  guardarOfertaPorcentaje(): void {
    const selected = this.items.filter((item) => this.selectedFamilies[item.Id]);

    if (!this.idSucursal.trim()) {
      this.toastr.warning('Captura la sucursal.', 'Aviso');
      return;
    }
    if (!this.referencia.trim()) {
      this.toastr.warning('Captura la referencia.', 'Aviso');
      return;
    }
    if (!this.porcentajeDescuento.trim()) {
      this.toastr.warning('Captura el porcentaje de descuento.', 'Aviso');
      return;
    }
    if (!this.fechaInicial || !this.fechaFinal) {
      this.toastr.warning('Captura fecha inicial y fecha final.', 'Aviso');
      return;
    }
    if (!selected.length) {
      this.toastr.warning('Selecciona al menos una familia.', 'Aviso');
      return;
    }

    const payload = {
      IdSucursal: this.idSucursal.trim(),
      Referencia: this.referencia.trim(),
      PorcentajeDescuento: this.porcentajeDescuento.trim(),
      FechaInicial: this.fechaInicial,
      FechaFinal: this.fechaFinal,
      Familias: selected.map((item) => ({ IdFamilia: String(item.Id) })),
    };

    this.saving = true;
    this.http.post<ApiResponse<unknown>>(`${environment.apiBase}/OfertasPorcentaje`, payload).subscribe({
      next: (res) => {
        const ok = res?.success === true || res?.StatusCode === 200;
        if (ok) {
          this.toastr.success('Oferta de porcentaje guardada correctamente.', 'Exito');
          this.resetForm();
          return;
        }
        this.toastr.danger(res?.message || 'No se pudo guardar la oferta de porcentaje.', 'Error');
      },
      error: () => {
        this.toastr.danger('Error de comunicacion al guardar la oferta de porcentaje.', 'Error');
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  private resetForm(): void {
    this.referencia = '';
    this.porcentajeDescuento = '';
    this.fechaInicial = '';
    this.fechaFinal = '';
    this.items.forEach((item) => {
      this.selectedFamilies[item.Id] = false;
    });
  }

  private applyFiltersAndSort(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const filtered = term
      ? this.items.filter((item) => {
          const departamento = (item.NombreDepartamento ?? '').toLowerCase();
          const familia = (item.Nombre ?? '').toLowerCase();
          return departamento.includes(term) || familia.includes(term) || String(item.Id).includes(term);
        })
      : [...this.items];

    if (this.sortColumn) {
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        const left = `${a[this.sortColumn] ?? ''}`.toLowerCase();
        const right = `${b[this.sortColumn] ?? ''}`.toLowerCase();
        if (left < right) {
          return -1 * direction;
        }
        if (left > right) {
          return 1 * direction;
        }
        return 0;
      });
    }

    this.displayItems = filtered;
    this.buildPage();
  }

  private buildPage(): void {
    if (!this.displayItems.length) {
      this.currentPage = 1;
      this.paginatedItems = [];
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, start + this.pageSize);
  }
}
