import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbToastrService } from '@nebular/theme';
import { environment } from '../../../../environments/environment';

interface ApiProveedorItem {
  Id: number;
  nombre?: string;
  Nombre?: string;
}

interface ApiProveedoresResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: { data?: ApiProveedorItem[] };
}

interface ApiInsertarNotaCargoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
}

interface ProveedorOption {
  id: number;
  nombre: string;
}

interface ApiConceptoNotaCargoItem {
  Id: number;
  Descripcion: string;
  AfectaInventarios: number;
  AfectaCargo: number;
}

interface ApiConceptosNotaCargoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: { data?: ApiConceptoNotaCargoItem[] };
}

interface ConceptoOption {
  id: number;
  descripcion: string;
}

interface ApiRemisionComboItem {
  Id: number;
  Factura: string;
}

interface ApiRemisionComboResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: { data?: ApiRemisionComboItem[] };
}

interface RemisionOption {
  id: number;
  factura: string;
}

@Component({
  selector: 'ngx-notas-de-cargo-insertar',
  templateUrl: './notas-de-cargo-insertar.component.html',
  styleUrls: ['./notas-de-cargo-insertar.component.scss'],
})
export class NotasDeCargoInsertarComponent implements OnInit {
  form: FormGroup;
  proveedores: ProveedorOption[] = [];
  conceptos: ConceptoOption[] = [];
  remisiones: RemisionOption[] = [];
  loadingProveedores = false;
  loadingConceptos = false;
  loadingRemisiones = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastr: NbToastrService,
  ) {
    let idSucursal = 1;
    let idUsuario = 1;
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        idSucursal = Number(u?.IdSucursal) || 1;
        idUsuario = Number(u?.Id) || 1;
      }
    } catch {}

    this.form = this.fb.group({
      idSucursal: [idSucursal],
      idProveedor: [null, Validators.required],
      idRemision: [null, Validators.required],
      concepto: ['', Validators.required],
      total: [null, Validators.required],
      referencia: ['', Validators.required],
      idUsuario: [idUsuario],
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarConceptos();
  }

  cargarProveedores(): void {
    this.loadingProveedores = true;
    this.http.post<ApiProveedoresResponse>(`${environment.apiBase}/GetProveedores`, {}).subscribe({
      next: (res) => {
        const raw = res?.response?.data ?? [];
        this.proveedores = raw
          .map((p) => ({
            id: Number(p.Id) || 0,
            nombre: String(p.nombre || p.Nombre || ''),
          }))
          .filter((p) => p.id > 0);

        if (!this.form.controls.idProveedor.value && this.proveedores.length > 0) {
          this.form.controls.idProveedor.setValue(this.proveedores[0].id);
        }
        this.cargarRemisiones();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'No se pudieron cargar los proveedores.';
        this.toastr.danger(msg, 'Notas de cargo');
        this.proveedores = [];
      },
      complete: () => {
        this.loadingProveedores = false;
      },
    });
  }

  cargarConceptos(): void {
    this.loadingConceptos = true;
    this.http.post<ApiConceptosNotaCargoResponse>(`${environment.apiBase}/GetConceptosNotaCargo`, {}).subscribe({
      next: (res) => {
        const raw = res?.response?.data ?? [];
        this.conceptos = raw
          .map((c) => ({
            id: Number(c.Id) || 0,
            descripcion: String(c.Descripcion || ''),
          }))
          .filter((c) => c.id > 0);

        if (!this.form.controls.concepto.value && this.conceptos.length > 0) {
          this.form.controls.concepto.setValue(String(this.conceptos[0].id));
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'No se pudieron cargar los conceptos.';
        this.toastr.danger(msg, 'Notas de cargo');
        this.conceptos = [];
      },
      complete: () => {
        this.loadingConceptos = false;
      },
    });
  }

  onProveedorChange(): void {
    this.cargarRemisiones();
  }

  cargarRemisiones(): void {
    const idSucursal = String(this.form.controls.idSucursal.value ?? 1);
    const idProveedor = String(this.form.controls.idProveedor.value ?? '');

    if (!idProveedor) {
      this.remisiones = [];
      this.form.controls.idRemision.setValue(null);
      return;
    }

    this.loadingRemisiones = true;
    const body = {
      IdSucursal: idSucursal,
      IdProveedor: idProveedor,
    };

    this.http.post<ApiRemisionComboResponse>(`${environment.apiBase}/GetRemisionesCombo`, body).subscribe({
      next: (res) => {
        const raw = res?.response?.data ?? [];
        this.remisiones = raw
          .map((r) => ({
            id: Number(r.Id) || 0,
            factura: String(r.Factura || ''),
          }))
          .filter((r) => r.id > 0);

        if (this.remisiones.length > 0) {
          this.form.controls.idRemision.setValue(this.remisiones[0].id);
        } else {
          this.form.controls.idRemision.setValue(null);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'No se pudieron cargar las remisiones.';
        this.toastr.danger(msg, 'Notas de cargo');
        this.remisiones = [];
        this.form.controls.idRemision.setValue(null);
      },
      complete: () => {
        this.loadingRemisiones = false;
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const body = {
      IdProveedor: String(v.idProveedor),
      IdRemision: Number(v.idRemision),
      Concepto: String(v.concepto),
      IdUsuario: String(v.idUsuario),
      Total: String(v.total),
      Referencia: String(v.referencia),
    };

    this.saving = true;
    this.http.post<ApiInsertarNotaCargoResponse>(`${environment.apiBase}/InsertarNotaCargo`, body).subscribe({
      next: (res) => {
        if (!res?.success) {
          this.toastr.danger(res?.message || 'No se pudo insertar la nota de cargo.', 'Notas de cargo');
          return;
        }
        this.toastr.success('Nota de cargo insertada correctamente.', 'Notas de cargo');
        this.form.patchValue({
          idRemision: this.remisiones.length ? this.remisiones[0].id : null,
          concepto: this.conceptos.length ? String(this.conceptos[0].id) : '',
          total: null,
          referencia: '',
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Error al insertar nota de cargo.';
        this.toastr.danger(msg, 'Notas de cargo');
      },
      complete: () => {
        this.saving = false;
      },
    });
  }
}
