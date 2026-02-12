import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import {
  GetListasPreciosPayload,
  ListaPrecioItem,
  ProveedorItem,
  ProveedoresService,
} from './proveedores.service';

type SortColumn = 'Id' | 'Proveedor' | 'IdProveedor' | 'Folio' | 'Usuario';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-proveedores-listas-precios',
  templateUrl: './listas-precios.component.html',
  styleUrls: ['./listas-precios.component.scss'],
})
export class ProveedoresListasPreciosComponent implements OnInit {
  filtros: GetListasPreciosPayload = {
    IdUsuario: '0',
    Codigo: '0',
    Proveedor: '0',
    Folio: '0',
  };

  proveedoresOptions: Array<{ value: string; label: string }> = [];
  proveedoresLoading = false;
  proveedoresError = '';

  items: ListaPrecioItem[] = [];
  displayItems: ListaPrecioItem[] = [];
  paginatedItems: ListaPrecioItem[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Id';
  sortDirection: SortDirection = 'asc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly proveedoresService: ProveedoresService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.buscar();
  }

  retryProveedores(): void {
    this.cargarProveedores();
  }

  buscar(): void {
    this.loading = true;
    this.error = '';
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.proveedoresService.obtenerListasPrecios(this.filtros).subscribe({
      next: (data) => {
        this.items = data || [];
        this.applyTransforms();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudieron obtener las listas de precios.';
      },
    });
  }

  retry(): void {
    this.buscar();
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
      Proveedor: item.Proveedor,
      IdProveedor: item.IdProveedor,
      Folio: item.Folio,
      Usuario: item.Usuario,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ListasPrecios');
    XLSX.writeFile(workbook, 'listas-precios.xlsx');
  }

  trackById(_: number, item: ListaPrecioItem): number {
    return item.Id;
  }

  verLista(id: number): void {
    if (!id) {
      return;
    }
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/pages/compras/proveedores/listas-precios', id]),
    );
    window.open(url, '_blank');
  }

  private cargarProveedores(): void {
    this.proveedoresLoading = true;
    this.proveedoresError = '';
    this.proveedoresService.obtenerProveedores().subscribe({
      next: (proveedores: ProveedorItem[]) => {
        const options = (proveedores || []).map((item) => ({
          value: String(item.Id),
          label: item.nombre || `Proveedor #${item.Id}`,
        }));
        this.proveedoresOptions = [{ value: '0', label: 'Todos' }, ...options];
        this.proveedoresLoading = false;
      },
      error: (err) => {
        this.proveedoresLoading = false;
        this.proveedoresError = err?.message || 'No se pudo cargar el catalogo de proveedores.';
        this.proveedoresOptions = [{ value: '0', label: 'Todos' }];
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

  private matchesTerm(item: ListaPrecioItem, term: string): boolean {
    return String(item.Id).toLowerCase().includes(term)
      || (item.Proveedor || '').toLowerCase().includes(term)
      || String(item.IdProveedor).toLowerCase().includes(term)
      || String(item.Folio).toLowerCase().includes(term)
      || (item.Usuario || '').toLowerCase().includes(term);
  }

  private compareRows(a: ListaPrecioItem, b: ListaPrecioItem): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'Id':
      case 'IdProveedor':
      case 'Folio':
        result = Number(a[this.sortColumn]) - Number(b[this.sortColumn]);
        break;
      case 'Proveedor':
      case 'Usuario':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }
    return result * factor;
  }
}
