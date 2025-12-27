import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';

import { MedicosService, Medico, CreateMedicoRequest } from './medicos.service';

@Component({
  selector: 'ngx-catalogos-medicos',
  templateUrl: './medicos.component.html',
  styleUrls: ['./medicos.component.scss'],
})
export class MedicosComponent implements OnInit {
  medicos: Medico[] = [];
  filteredMedicos: Medico[] = [];
  paginatedMedicos: Medico[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 20, 50];
  createForm: FormGroup;
  creating = false;
  createError = '';
  createSuccess = '';
  private readonly emptyCreateFormValue: CreateMedicoRequest = {
    Numero: '',
    Cedula: '',
    Nombre: '',
    ApPaterno: '',
    ApMaterno: '',
    Domicilio: '',
    Telefono: '',
    TelefonoCasa: '',
  };

  constructor(private readonly fb: FormBuilder, private readonly medicosService: MedicosService) {
    this.createForm = this.buildCreateForm();
  }

  ngOnInit(): void {
    this.loadMedicos();
  }

  loadMedicos(): void {
    this.loading = true;
    this.errorMessage = '';
    this.medicos = [];
    this.filteredMedicos = [];
    this.paginatedMedicos = [];
    this.medicosService.fetchMedicos().subscribe({
      next: (items) => {
        this.medicos = items ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Ocurrió un problema al recuperar los datos.';
      },
    });
  }

  submitNewMedico(): void {
    this.createSuccess = '';
    this.createError = '';
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating = true;
    const payload = this.createForm.value as CreateMedicoRequest;
    this.medicosService.createMedico(payload).subscribe({
      next: () => {
        this.creating = false;
        this.createSuccess = 'Médico registrado correctamente.';
        this.resetCreateForm();
        this.loadMedicos();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err?.message ?? 'No se pudo registrar el médico.';
      },
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
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
    if (!this.filteredMedicos.length) {
      return;
    }

    const data = this.filteredMedicos.map((item) => ({
      Numero: item.Numero,
      Nombre: this.getNombreCompleto(item),
      Cedula: item.Cedula,
      Telefono: this.getTelefonoPreferido(item),
      Estatus: this.getEstatusLabel(item.Estatus),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicos');
    XLSX.writeFile(workbook, 'medicos.xlsx');
  }

  get totalItems(): number {
    return this.filteredMedicos.length;
  }

  get totalPages(): number {
    return this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  get rangeStart(): number {
    return this.totalItems ? (this.page - 1) * this.pageSize + 1 : 0;
  }

  get rangeEnd(): number {
    return this.totalItems ? this.rangeStart + this.paginatedMedicos.length - 1 : 0;
  }

  trackById(_index: number, item: Medico): number {
    return item.Id;
  }

  getNombreCompleto(medico: Medico): string {
    return [medico.Nombre, medico.ApPaterno, medico.ApMaterno].filter(Boolean).join(' ');
  }

  getTelefonoPreferido(medico: Medico): string {
    return medico.Telefono && medico.Telefono !== '0'
      ? medico.Telefono
      : medico.TelefonoCasa && medico.TelefonoCasa !== '0'
      ? medico.TelefonoCasa
      : 'Sin teléfono';
  }

  getEstatusLabel(estatus: number): string {
    return estatus === 1 ? 'Activo' : 'Inactivo';
  }

  getEstatusStatus(estatus: number): 'success' | 'danger' | 'warning' {
    if (estatus === 1) {
      return 'success';
    }
    return 'danger';
  }

  hasFieldError(controlName: keyof CreateMedicoRequest): boolean {
    const control = this.createForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get isSubmitDisabled(): boolean {
    return this.creating || this.createForm.invalid;
  }

  onView(medico: Medico): void {
    console.log('Ver médico', medico);
  }

  onEdit(medico: Medico): void {
    console.log('Editar médico', medico);
  }

  onDelete(medico: Medico): void {
    console.log('Eliminar médico', medico);
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredMedicos = term
      ? this.medicos.filter((item) => this.matchesTerm(item, term))
      : [...this.medicos];
    this.page = 1;
    this.buildPage();
  }

  private matchesTerm(item: Medico, term: string): boolean {
    const numero = item.Numero?.toLowerCase() ?? '';
    const cedula = item.Cedula?.toLowerCase() ?? '';
    const nombre = this.getNombreCompleto(item).toLowerCase();
    const domicilio = item.Domicilio?.toLowerCase() ?? '';
    const telefono = this.getTelefonoPreferido(item).toLowerCase();
    return numero.includes(term) || cedula.includes(term) || nombre.includes(term) || domicilio.includes(term) || telefono.includes(term);
  }

  private buildPage(): void {
    if (!this.totalItems) {
      this.page = 1;
      this.paginatedMedicos = [];
      return;
    }

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    const start = (this.page - 1) * this.pageSize;
    this.paginatedMedicos = this.filteredMedicos.slice(start, start + this.pageSize);
  }

  private buildCreateForm(): FormGroup {
    return this.fb.group({
      Numero: [this.emptyCreateFormValue.Numero, [Validators.required]],
      Cedula: [this.emptyCreateFormValue.Cedula, [Validators.required]],
      Nombre: [this.emptyCreateFormValue.Nombre, [Validators.required]],
      ApPaterno: [this.emptyCreateFormValue.ApPaterno, [Validators.required]],
      ApMaterno: [this.emptyCreateFormValue.ApMaterno],
      Domicilio: [this.emptyCreateFormValue.Domicilio, [Validators.required]],
      Telefono: [this.emptyCreateFormValue.Telefono],
      TelefonoCasa: [this.emptyCreateFormValue.TelefonoCasa],
    });
  }

  resetCreateForm(): void {
    this.createForm.reset(this.emptyCreateFormValue);
  }
}
