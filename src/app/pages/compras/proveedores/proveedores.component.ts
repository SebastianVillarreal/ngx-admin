import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  InsertProveedorPayload,
  ProveedorItem,
  ProveedoresService,
} from './proveedores.service';

@Component({
  selector: 'ngx-proveedores-compras',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresComponent implements OnInit {
  readonly proveedorForm = this.fb.group({
    clave: this.fb.control('', Validators.required),
    nombre: this.fb.control('', Validators.required),
    direccion: this.fb.control('', Validators.required),
    ciudad: this.fb.control('', Validators.required),
    telefono: this.fb.control('', Validators.required),
    rfc: this.fb.control('', Validators.required),
    email: this.fb.control('', [Validators.required, Validators.email]),
    contacto: this.fb.control('', Validators.required),
    estado: this.fb.control('', Validators.required),
    pais: this.fb.control('', Validators.required),
    codigoPostal: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    giro: this.fb.control('', Validators.required),
    condicion: this.fb.control('', Validators.required),
    tipo: this.fb.control(1, Validators.required),
    representante: this.fb.control('', Validators.required),
    cuentaContable: this.fb.control('', Validators.required),
    retencion: this.fb.control(0, [Validators.min(0)]),
    retencionIva: this.fb.control(0, [Validators.min(0)]),
    banco: this.fb.control('', Validators.required),
    Clabe: this.fb.control('', Validators.required),
    Convenio: this.fb.control('', Validators.required),
    TipoPago: this.fb.control(1, Validators.required),
    Agente: this.fb.control('', Validators.required),
    Supervisor: this.fb.control('', Validators.required),
    Comentarios: this.fb.control(''),
    Referencia: this.fb.control(''),
    CuentaContableGlobalBonificacion: this.fb.control('', Validators.required),
  });

  proveedores: ProveedorItem[] = [];
  loading = false;
  error = '';
  filtro = '';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;
  guardandoProveedor = false;
  mensajeFormularioExito = '';
  mensajeFormularioError = '';

  readonly tipoOptions = [
    { value: 1, label: 'Compras' },
    { value: 2, label: 'Gasto' },
    { value: 3, label: 'Servicio' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly proveedoresService: ProveedoresService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  get proveedoresFiltrados(): ProveedorItem[] {
    const term = this.filtro.trim().toLowerCase();
    if (!term) {
      return this.proveedores;
    }
    return this.proveedores.filter((proveedor) => {
      return (
        proveedor.nombre?.toLowerCase().includes(term) ||
        proveedor.rfc?.toLowerCase().includes(term) ||
        proveedor.descripcionTipo?.toLowerCase().includes(term) ||
        proveedor.CuentaContableGlobalBonificacion?.toLowerCase().includes(term)
      );
    });
  }

  get proveedoresPaginados(): ProveedorItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.proveedoresFiltrados.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    const total = Math.ceil(this.proveedoresFiltrados.length / this.pageSize);
    return total || 1;
  }

  onActualizar(): void {
    this.cargarProveedores();
  }

  onEditar(proveedor: ProveedorItem): void {
    console.info('Editar proveedor', proveedor);
  }

  onGuardarProveedor(): void {
    this.mensajeFormularioExito = '';
    this.mensajeFormularioError = '';
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      this.mensajeFormularioError = 'Completa la información requerida.';
      return;
    }

    const payload = this.buildInsertPayload();
    this.guardandoProveedor = true;
    this.proveedoresService
      .insertarProveedor(payload)
      .pipe(
        finalize(() => {
          this.guardandoProveedor = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.mensajeFormularioExito = 'Proveedor registrado correctamente.';
          this.resetProveedorForm();
          this.cargarProveedores();
        },
        error: (error: Error) => {
          this.mensajeFormularioError = error.message;
        },
      });
  }

  onFiltroChange(value: string): void {
    this.filtro = value;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  onPaginar(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage -= 1;
    }
    if (direction === 'next' && this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
    this.cdr.markForCheck();
  }

  onExport(): void {
    const rows = this.proveedoresFiltrados;
    if (!rows.length) {
      return;
    }
    const headers = [
      'Id',
      'Nombre',
      'Direccion',
      'RFC',
      'Plazo',
      'Email',
      'Telefono',
      'DescripcionTipo',
      'CuentaContableGlobalBonificacion',
    ];
    const data = rows.map((item) => [
      item.Id,
      item.nombre,
      item.direccion ?? '',
      item.rfc,
      item.condicion ?? '',
      item.email ?? '',
      item.telefono ?? '',
      item.descripcionTipo ?? '',
      item.CuentaContableGlobalBonificacion ?? '',
    ]);
    const csvContent = [headers, ...data]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proveedores.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private cargarProveedores(): void {
    this.loading = true;
    this.error = '';
    this.proveedoresService
      .obtenerProveedores()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.proveedores = items;
          this.currentPage = 1;
        },
        error: (err: Error) => {
          this.error = err.message;
          this.proveedores = [];
        },
      });
  }

  private buildInsertPayload(): InsertProveedorPayload {
    const formValue = this.proveedorForm.getRawValue();
    return {
      clave: formValue.clave,
      nombre: formValue.nombre,
      direccion: formValue.direccion,
      ciudad: formValue.ciudad,
      telefono: formValue.telefono,
      rfc: formValue.rfc,
      email: formValue.email,
      contacto: formValue.contacto,
      estado: formValue.estado,
      pais: formValue.pais,
      codigoPostal: Number(formValue.codigoPostal ?? 0),
      giro: formValue.giro,
      condicion: formValue.condicion,
      tipo: Number(formValue.tipo ?? 0),
      representante: formValue.representante,
      cuentaContable: formValue.cuentaContable,
      retencion: Number(formValue.retencion ?? 0),
      retencionIva: Number(formValue.retencionIva ?? 0),
      banco: formValue.banco,
      Clabe: formValue.Clabe,
      Convenio: formValue.Convenio,
      TipoPago: Number(formValue.TipoPago ?? 0),
      Agente: formValue.Agente,
      Supervisor: formValue.Supervisor,
      Comentarios: formValue.Comentarios ?? '',
      Referencia: formValue.Referencia ?? '',
      CuentaContableGlobalBonificacion: formValue.CuentaContableGlobalBonificacion,
    };
  }

  private resetProveedorForm(): void {
    this.proveedorForm.reset({
      clave: '',
      nombre: '',
      direccion: '',
      ciudad: '',
      telefono: '',
      rfc: '',
      email: '',
      contacto: '',
      estado: '',
      pais: '',
      codigoPostal: null,
      giro: '',
      condicion: '',
      tipo: 1,
      representante: '',
      cuentaContable: '',
      retencion: 0,
      retencionIva: 0,
      banco: '',
      Clabe: '',
      Convenio: '',
      TipoPago: 1,
      Agente: '',
      Supervisor: '',
      Comentarios: '',
      Referencia: '',
      CuentaContableGlobalBonificacion: '',
    });
  }
}
