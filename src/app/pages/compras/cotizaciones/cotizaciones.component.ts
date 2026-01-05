import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CotizacionesService, ProveedorDto } from './cotizaciones.service';

interface ProveedorOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-cotizaciones-compras',
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesComponent implements OnInit {
  readonly cotizacionForm = this.fb.group({
    proveedor: this.fb.control('', Validators.required),
    sucursal: this.fb.control('', Validators.required),
    fechaLlegada: this.fb.control('', Validators.required),
  });

  guardando = false;
  finalizando = false;
  mensajeExito = '';
  mensajeError = '';

  proveedores: ProveedorOption[] = [];
  proveedoresLoading = false;
  proveedoresError = '';
  folioCotizacion?: number;

  readonly sucursales = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly cotizacionesService: CotizacionesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  onGuardar(): void {
    this.resetMensajes();
    if (this.cotizacionForm.invalid) {
      this.cotizacionForm.markAllAsTouched();
      this.mensajeError = 'Selecciona un proveedor y la fecha estimada de llegada.';
      return;
    }

    const { proveedor, sucursal } = this.cotizacionForm.getRawValue();
    if (!proveedor || !sucursal) {
      this.mensajeError = 'Selecciona un proveedor y una sucursal válidos.';
      return;
    }

    const payload = {
      IdSucursal: sucursal,
      IdProveedor: proveedor,
      IdUsuario: '1',
    };

    this.guardando = true;
    this.cotizacionesService
      .insertarCotizacion(payload)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (folio) => {
          this.folioCotizacion = folio;
          this.mensajeExito = `Cotización ${folio} guardada correctamente.`;
          this.guardarFolioComoTxt(folio);
        },
        error: (error: Error) => {
          this.mensajeError = error.message;
        },
      });
  }

  onFinalizar(): void {
    this.resetMensajes();
    if (this.cotizacionForm.invalid) {
      this.cotizacionForm.markAllAsTouched();
      this.mensajeError = 'Completa los datos antes de finalizar la cotización.';
      return;
    }

    this.finalizando = true;
    setTimeout(() => {
      this.finalizando = false;
      this.mensajeExito = 'Cotización finalizada y lista para enviar a compras.';
      this.cotizacionForm.reset({
        proveedor: '',
        sucursal: '',
        fechaLlegada: '',
      });
      this.cdr.markForCheck();
    }, 800);
  }

  private resetMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private cargarProveedores(): void {
    this.proveedoresLoading = true;
    this.proveedoresError = '';
    this.cotizacionesService
      .obtenerProveedores()
      .pipe(
        finalize(() => {
          this.proveedoresLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.proveedores = this.mapProveedores(items);
          if (this.proveedores.length === 1) {
            this.cotizacionForm.get('proveedor')?.setValue(this.proveedores[0].value);
          }
        },
        error: (error: Error) => {
          this.proveedoresError = error.message;
        },
      });
  }

  private mapProveedores(items: ProveedorDto[]): ProveedorOption[] {
    return (items || []).map((item) => ({
      value: String(item.Id),
      label: item.nombre,
    }));
  }

  private guardarFolioComoTxt(folio: number): void {
    if (!folio) {
      return;
    }
    const contenido = `CotizacionId=${folio}`;
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cotizacion-${folio}.txt`;
    enlace.click();
    window.URL.revokeObjectURL(url);
  }
}
