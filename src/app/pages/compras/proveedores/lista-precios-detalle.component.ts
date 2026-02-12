import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

import {
  DatosListaHeader,
  ProveedoresService,
  RenglonListaItem,
} from './proveedores.service';

type SortColumn =
  | 'Codigo'
  | 'Descripcion'
  | 'CostoAD'
  | 'CostoDD'
  | 'PD'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D5';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-lista-precios-detalle',
  templateUrl: './lista-precios-detalle.component.html',
  styleUrls: ['./lista-precios-detalle.component.scss'],
})
export class ListaPreciosDetalleComponent implements OnInit {
  listaId = 0;
  header: DatosListaHeader | null = null;
  loading = false;
  error = '';

  items: RenglonListaItem[] = [];
  displayItems: RenglonListaItem[] = [];
  paginatedItems: RenglonListaItem[] = [];
  searchTerm = '';
  sortColumn: SortColumn = 'Codigo';
  sortDirection: SortDirection = 'asc';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly proveedoresService: ProveedoresService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.listaId = Number(params.get('id') || '0');
      this.cargarDetalle();
    });
  }

  retry(): void {
    this.cargarDetalle();
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
      Descripcion: item.Descripcion,
      CostoAD: item.CostoAD,
      CostoDD: item.CostoDD,
      PD: item.PD,
      D1: item.D1,
      D2: item.D2,
      D3: item.D3,
      D4: item.D4,
      D5: item.D5,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DetalleLista');
    XLSX.writeFile(workbook, `lista-precios-${this.listaId}.xlsx`);
  }

  trackByRenglon(_: number, item: RenglonListaItem): number {
    return item.Id;
  }

  private cargarDetalle(): void {
    if (!this.listaId) {
      this.error = 'Id de lista invalido.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.header = null;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    forkJoin({
      header: this.proveedoresService.obtenerDatosLista(this.listaId),
      renglones: this.proveedoresService.obtenerRenglonesLista(this.listaId),
    }).subscribe({
      next: ({ header, renglones }) => {
        this.header = header;
        this.items = renglones || [];
        this.applyTransforms();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo cargar el detalle de la lista.';
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

  private matchesTerm(item: RenglonListaItem, term: string): boolean {
    return (item.Codigo || '').toLowerCase().includes(term)
      || (item.Descripcion || '').toLowerCase().includes(term)
      || (item.PD || '').toLowerCase().includes(term)
      || String(item.CostoAD ?? '').toLowerCase().includes(term)
      || String(item.CostoDD ?? '').toLowerCase().includes(term)
      || String(item.D1 ?? '').toLowerCase().includes(term)
      || String(item.D2 ?? '').toLowerCase().includes(term)
      || String(item.D3 ?? '').toLowerCase().includes(term)
      || String(item.D4 ?? '').toLowerCase().includes(term)
      || String(item.D5 ?? '').toLowerCase().includes(term);
  }

  private compareRows(a: RenglonListaItem, b: RenglonListaItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'CostoAD':
      case 'CostoDD':
      case 'D1':
      case 'D2':
      case 'D3':
      case 'D4':
      case 'D5':
        result = (Number(a[this.sortColumn]) || 0) - (Number(b[this.sortColumn]) || 0);
        break;
      case 'Codigo':
      case 'Descripcion':
      case 'PD':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }
    return result * factor;
  }
}
