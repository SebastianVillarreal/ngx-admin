import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { TraspasosService, TraspasoEnTransito } from '../traspasos/traspasos.service';

interface SucursalOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-traspasos-en-transito',
  templateUrl: './traspasos-en-transito.component.html',
  styleUrls: ['./traspasos-en-transito.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraspasosEnTransitoComponent {
  readonly sucursales: SucursalOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly filtroForm = this.fb.group({
    sucursal: this.fb.control('', Validators.required),
  });

  cargando = false;
  mensaje = '';
  error = '';
  traspasos: TraspasoEnTransito[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onBuscar(): void {
    this.mensaje = '';
    this.error = '';

    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.error = 'Selecciona una sucursal para consultar los traspasos.';
      this.markForCheck();
      return;
    }

    const sucursalSeleccionada = this.filtroForm.value.sucursal as string;
    const nombreSucursal = this.obtenerNombreSucursal(sucursalSeleccionada);

    this.cargando = true;
    this.traspasos = [];
    this.markForCheck();

    this.traspasosService.obtenerTraspasosEnTransito(sucursalSeleccionada).subscribe({
      next: (traspasos) => {
        this.traspasos = traspasos;
        this.mensaje = traspasos.length
          ? `Se encontraron ${traspasos.length} traspaso(s) en tránsito enviados desde Matriz hacia ${nombreSucursal}.`
          : `No hay traspasos en tránsito enviados desde Matriz hacia ${nombreSucursal}.`;
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener los traspasos en tránsito.';
        this.cargando = false;
        this.markForCheck();
      },
    });
  }

  private obtenerNombreSucursal(valor: string): string {
    return this.sucursales.find((s) => s.value === valor)?.label ?? 'la sucursal seleccionada';
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
