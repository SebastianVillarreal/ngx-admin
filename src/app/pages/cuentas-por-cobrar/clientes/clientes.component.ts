import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

import { ClientesService, Cliente, InsertClientePayload } from './clientes.service';

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
  clienteForm: FormGroup;
  submitting = false;
  submitSuccess = '';
  submitError = '';
  regimenOptions: Array<{ value: string; label: string }> = [];
  cfdiOptions: Array<{ value: string; label: string }> = [];
  editingClienteId: number | null = null;
  editingClienteNombre = '';
  editingClienteLoading = false;

  constructor(
    private readonly clientesService: ClientesService,
    private readonly fb: FormBuilder,
  ) {
    this.clienteForm = this.buildForm();
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadUsoCfdi();
    this.loadRegimenFiscal();
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

  submitCliente(): void {
    this.submitSuccess = '';
    this.submitError = '';
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    if (this.editingClienteId) {
      this.submitError = 'Pendiente el servicio de actualización para completar la edición.';
      return;
    }

    const payload = this.buildInsertPayload();
    this.submitting = true;
    this.clientesService.insertCliente(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.submitSuccess = res?.message || 'Cliente registrado correctamente.';
        this.clienteForm.reset();
        this.loadClientes(this.lastSearch);
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.message || 'No se pudo registrar el cliente.';
      },
    });
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
    if (!cliente?.Id) {
      return;
    }

    this.loadClienteDetalle(cliente.Id);
  }

  cancelEdit(): void {
    this.editingClienteId = null;
    this.editingClienteNombre = '';
    this.submitError = '';
    this.submitSuccess = '';
    this.clienteForm.reset();
  }

  private loadUsoCfdi(): void {
    this.clientesService.fetchUsoCfdi().subscribe({
      next: (options) => {
        this.cfdiOptions = options;
      },
      error: (err) => {
        console.error(err?.message || 'No se pudo recuperar el catálogo de uso de CFDI.');
      },
    });
  }

  private loadRegimenFiscal(): void {
    this.clientesService.fetchRegimenFiscal().subscribe({
      next: (options) => {
        this.regimenOptions = options;
      },
      error: (err) => {
        console.error(err?.message || 'No se pudo recuperar el catálogo de régimen fiscal.');
      },
    });
  }

  private loadClienteDetalle(id: number): void {
    this.editingClienteLoading = true;
    this.submitError = '';
    this.submitSuccess = '';
    this.clientesService.fetchClienteById(id).subscribe({
      next: (detalle) => {
        this.editingClienteLoading = false;
        if (!detalle) {
          this.submitError = 'No se encontró información del cliente seleccionado.';
          return;
        }
        this.editingClienteId = detalle.Id ?? id;
        this.editingClienteNombre = detalle.Nombre || '';
        this.patchFormWithCliente(detalle);
      },
      error: (err) => {
        this.editingClienteLoading = false;
        this.submitError = err?.message || 'No se pudo obtener la información del cliente.';
      },
    });
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      Nombre: ['', Validators.required],
      rfc: ['', Validators.required],
      condicionPago: [''],
      limiteCredito: [''],
      correo: ['', Validators.email],
      direccion: [''],
      telefono: [''],
      codPostal: [''],
      ciudad: [''],
      colonia: [''],
      representante: [''],
      banco: [''],
      cuenta: [''],
      comentarios: [''],
      usuario: ['', Validators.required],
      contacto: [''],
      Aval: [''],
      TelefonoAval: [''],
      Cfdi: [''],
      regimen: [''],
    });
  }

  private buildInsertPayload(): InsertClientePayload {
    const raw = this.clienteForm.value;
    return {
      Nombre: raw.Nombre || '',
      rfc: raw.rfc || '',
      condicionPago: raw.condicionPago || '',
      limiteCredito: raw.limiteCredito || '',
      correo: raw.correo || '',
      direccion: raw.direccion || '',
      telefono: raw.telefono || '',
      codPostal: raw.codPostal || '',
      ciudad: raw.ciudad || '',
      colonia: raw.colonia || '',
      representante: raw.representante || '',
      banco: raw.banco || '',
      cuenta: raw.cuenta || '',
      comentarios: raw.comentarios || '',
      usuario: raw.usuario || '',
      contacto: raw.contacto || '',
      Aval: raw.Aval || '',
      TelefonoAval: raw.TelefonoAval || '',
      Cfdi: raw.Cfdi || '',
      regimen: raw.regimen || '',
    };
  }

  private patchFormWithCliente(cliente: Cliente): void {
    this.clienteForm.patchValue({
      Nombre: cliente.Nombre ?? '',
      rfc: cliente.Rfc ?? '',
      condicionPago: cliente.CondicionPago ?? '',
      limiteCredito: cliente.LimiteCredito?.toString() ?? '',
      correo: cliente.Correo && cliente.Correo !== 'N/A' ? cliente.Correo : '',
      direccion: cliente.direccion ?? cliente.DireccionFiscal ?? '',
      telefono: cliente.Telefono ?? '',
      codPostal: cliente.CodPostal ?? '',
      ciudad: cliente.Ciudad ?? '',
      colonia: cliente.Colonia ?? '',
      representante: cliente.Representante ?? '',
      banco: cliente.Banco ?? '',
      cuenta: cliente.Cuenta ?? '',
      comentarios: cliente.Comentarios ?? '',
      usuario: '',
      contacto: cliente.Contacto ?? '',
      Aval: cliente.Aval ?? '',
      TelefonoAval: cliente.TelefonoAval ?? '',
      Cfdi: cliente.Cfdi ?? '',
      regimen: cliente.Regimen ?? '',
    });
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
