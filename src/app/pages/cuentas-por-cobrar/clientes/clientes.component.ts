import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { ClientesService, Cliente } from './clientes.service';

@Component({
  selector: 'ngx-cuentas-por-cobrar-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  paginatedClientes: Cliente[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  private lastSearch = '';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];

  constructor(private readonly clientesService: ClientesService) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(filter?: string): void {
    const nombre = (filter ?? this.searchTerm).trim();
    this.lastSearch = nombre;
    this.loading = true;
    this.errorMessage = '';
    this.clientes = [];
    this.paginatedClientes = [];
    this.clientesService.fetchClientes(nombre).subscribe({
      next: (items) => {
        this.clientes = items ?? [];
        this.page = 1;
        this.buildPage();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'No se pudo obtener la información de clientes.';
      },
    });
  }

  onSearch(): void {
    this.loadClientes(this.searchTerm);
  }

  onRefresh(): void {
    this.loadClientes(this.lastSearch);
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.buildPage();
  }

  goToPreviousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.buildPage();
    }
  }

  goToNextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.buildPage();
    }
  }

  exportToExcel(): void {
    if (!this.clientes.length) {
      return;
    }

    const data = this.clientes.map((cliente) => ({
      Id: cliente.Id,
      Nombre: cliente.Nombre,
      RFC: cliente.Rfc,
      Correo: cliente.Correo || 'N/A',
      Direccion: this.resolveDireccion(cliente),
      Telefono: this.resolveTelefono(cliente),
      Banco: cliente.Banco || 'N/A',
      Cuenta: cliente.Cuenta || 'N/A',
      Comentarios: cliente.Comentarios || 'Sin comentarios',
      CFDI: cliente.Cfdi || 'N/A',
      Estatus: cliente.IdEstatus === 1 ? 'Activo' : 'Inactivo',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, 'clientes.xlsx');
  }

  get totalItems(): number {
    return this.clientes.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedClientes.length - 1 : 0;
  }

  trackById(_index: number, item: Cliente): number {
    return item.Id;
  }

  resolveDireccion(cliente: Cliente): string {
    return cliente.direccion || cliente.DireccionFiscal || 'Sin dirección registrada';
  }

  resolveTelefono(cliente: Cliente): string {
    return cliente.Telefono || 'Sin teléfono';
  }

  onToggleEstatus(cliente: Cliente): void {
    console.log('Toggle estatus', cliente);
  }

  onEdit(cliente: Cliente): void {
    console.log('Editar cliente', cliente);
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.page = 1;
      this.paginatedClientes = [];
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedClientes = this.clientes.slice(start, start + this.pageSize);
  }
}
