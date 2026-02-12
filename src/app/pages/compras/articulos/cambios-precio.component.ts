import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

import { ArticulosService, CambioPrecioItem } from './articulos.service';

interface CambioPrecioRow {
  codigo: string;
  costo: string;
  precioFinal: string;
  precioMayoreo: string;
  precioMayoreoCred: string;
}

type SortColumn = 'Codigo' | 'Descripcion' | 'Costo' | 'PrecioFinal' | 'PrecioMayoreo' | 'PrecioMayoreoCred';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-cambios-precio',
  templateUrl: './cambios-precio.component.html',
  styleUrls: ['./cambios-precio.component.scss'],
})
export class CambiosPrecioComponent {
  fileName = '';
  selectedFile: File | null = null;
  parsedRows: CambioPrecioRow[] = [];
  importing = false;
  successMessage = '';
  errorMessage = '';
  summaryMessage = '';

  items: CambioPrecioItem[] = [];
  displayItems: CambioPrecioItem[] = [];
  paginatedItems: CambioPrecioItem[] = [];
  cambiosLoading = false;
  cambiosError = '';
  searchTerm = '';
  sortColumn: SortColumn = 'Codigo';
  sortDirection: SortDirection = 'asc';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  private readonly idUsuario = '1';
  private readonly idSucursal = '1';

  constructor(private readonly articulosService: ArticulosService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.selectedFile = file;
    this.fileName = file?.name || '';
    this.successMessage = '';
    this.errorMessage = '';
    this.summaryMessage = '';
    this.parsedRows = [];
  }

  async onImportar(): Promise<void> {
    if (!this.selectedFile) {
      this.errorMessage = 'Selecciona un archivo Excel para continuar.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.summaryMessage = '';
    this.importing = true;

    try {
      this.parsedRows = await this.readExcelRows(this.selectedFile);
      if (!this.parsedRows.length) {
        this.errorMessage = 'El archivo no contiene renglones validos para importar.';
        return;
      }

      await this.guardarLote();
    } catch (error) {
      this.errorMessage = (error as Error)?.message || 'No se pudo leer el archivo.';
    } finally {
      this.importing = false;
    }
  }

  async onGuardar(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.summaryMessage = '';
    this.importing = true;

    try {
      const ok = await this.articulosService.ejecutarCambioPrecios().toPromise();
      if (!ok) {
        this.errorMessage = 'No se pudo ejecutar el cambio de precios.';
        return;
      }
      this.successMessage = 'Cambios de precio ejecutados correctamente.';
      await this.loadCambiosPrecio();
    } catch (error) {
      this.errorMessage = (error as Error)?.message || 'No se pudo ejecutar el cambio de precios.';
    } finally {
      this.importing = false;
    }
  }

  async retryCambiosPrecio(): Promise<void> {
    await this.loadCambiosPrecio();
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
      Codigo: item.Codigo,
      Descripcion: item.Descripcion || '',
      Costo: item.Costo,
      PrecioFinal: item.PrecioFinal,
      PrecioMayoreo: item.PrecioMayoreo,
      PrecioMayoreoCred: item.PrecioMayoreoCred,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CambiosPrecio');
    XLSX.writeFile(workbook, 'cambios-precio.xlsx');
  }

  trackByCodigo(_: number, item: CambioPrecioItem): string {
    return item.Codigo;
  }

  private async guardarLote(): Promise<void> {
    const folioOk = await this.articulosService.insertFolioCambioPrecio({
      IdSucursal: this.idSucursal,
      IdUsuario: this.idUsuario,
    }).toPromise();

    if (!folioOk) {
      throw new Error('No se pudo crear el folio de cambio de precio.');
    }

    let okCount = 0;
    const failedRows: number[] = [];

    for (let i = 0; i < this.parsedRows.length; i += 1) {
      const row = this.parsedRows[i];
      const saved = await this.articulosService.insertCambioPrecio({
        Codigo: row.codigo,
        Costo: row.costo,
        PrecioFinal: row.precioFinal,
        PrecioMayoreo: row.precioMayoreo,
        PrecioMayoreoCred: row.precioMayoreoCred,
        IdUsuario: this.idUsuario,
      }).toPromise();

      if (saved) {
        okCount += 1;
      } else {
        failedRows.push(i + 2);
      }
    }

    this.summaryMessage = `Procesados: ${this.parsedRows.length}. Exitosos: ${okCount}. Fallidos: ${failedRows.length}.`;
    if (failedRows.length) {
      this.errorMessage = `No se pudieron guardar los renglones: ${failedRows.join(', ')}.`;
    } else {
      this.successMessage = 'Importacion y guardado completados correctamente.';
      this.errorMessage = '';
    }

    await this.loadCambiosPrecio();
  }

  private async loadCambiosPrecio(): Promise<void> {
    this.cambiosLoading = true;
    this.cambiosError = '';
    try {
      const data = await this.articulosService.getCambiosPrecio().toPromise();
      this.items = data || [];
      this.currentPage = 1;
      this.applyTransforms();
    } catch (error) {
      this.items = [];
      this.displayItems = [];
      this.paginatedItems = [];
      this.cambiosError = (error as Error)?.message || 'No se pudo cargar la tabla de cambios de precio.';
    } finally {
      this.cambiosLoading = false;
    }
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) => this.matchesSearch(item, term))
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private matchesSearch(item: CambioPrecioItem, term: string): boolean {
    return (item.Codigo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || String(item.Costo ?? '').toLowerCase().includes(term)
      || String(item.PrecioFinal ?? '').toLowerCase().includes(term)
      || String(item.PrecioMayoreo ?? '').toLowerCase().includes(term)
      || String(item.PrecioMayoreoCred ?? '').toLowerCase().includes(term);
  }

  private compareRows(a: CambioPrecioItem, b: CambioPrecioItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Costo':
      case 'PrecioFinal':
      case 'PrecioMayoreo':
      case 'PrecioMayoreoCred':
        result = (Number(a[this.sortColumn]) || 0) - (Number(b[this.sortColumn]) || 0);
        break;
      case 'Codigo':
      case 'Descripcion':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }
    return result * factor;
  }

  private readExcelRows(file: File): Promise<CambioPrecioRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const data = reader.result as ArrayBuffer;
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          if (!worksheet) {
            resolve([]);
            return;
          }

          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
            header: 1,
            raw: false,
          });

          const parsed: CambioPrecioRow[] = [];
          for (let i = 1; i < rows.length; i += 1) {
            const row = rows[i] || [];
            const codigo = String(row[0] ?? '').trim();
            if (!codigo) {
              continue;
            }

            parsed.push({
              codigo,
              costo: this.toDecimalString(row[1]),
              precioFinal: this.toDecimalString(row[2]),
              precioMayoreo: this.toDecimalString(row[3]),
              precioMayoreoCred: this.toDecimalString(row[4]),
            });
          }

          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      };

      reader.onerror = () => reject(new Error('No se pudo leer el archivo Excel.'));
      reader.readAsArrayBuffer(file);
    });
  }

  private toDecimalString(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'number') {
      return value.toString();
    }

    const input = String(value).trim().replace(/\s+/g, '');
    if (!input) {
      return '';
    }

    let normalized = input;
    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');
    if (hasComma && hasDot) {
      if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        normalized = normalized.replace(/,/g, '');
      }
    } else if (hasComma) {
      normalized = normalized.replace(',', '.');
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed.toString() : '';
  }
}
