import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import {
  InventariosService,
  VerificadorInventarioPayload,
  VerificadorInventarioRecord,
} from '../inventarios.service';

type MovimientoMetricKey = Exclude<keyof VerificadorInventarioRecord, 'Descripcion'>;

type MovimientoConfig = {
  label: string;
  key: MovimientoMetricKey;
};

@Component({
  selector: 'ngx-verificador',
  templateUrl: './verificador.component.html',
  styleUrls: ['./verificador.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificadorComponent {
  lastCriteria?: {
    sucursalId: string;
    codigo: string;
    fechaInicio: string;
    fechaFin: string;
  };

  resultado?: VerificadorInventarioRecord | null;
  consultaCompletada = false;
  isLoading = false;
  errorMessage: string | null = null;

  readonly sucursales = [
    { id: '1', nombre: 'Matriz' },
    { id: '2', nombre: 'Sucursal Norte' },
    { id: '3', nombre: 'Sucursal Sur' },
  ];

  readonly entradasConfig: MovimientoConfig[] = [
    { label: 'Entrada por compra', key: 'Compras' },
    { label: 'Entrada por traspaso', key: 'EntradasTraspaso' },
    { label: 'Entrada por conversión', key: 'EntradasConversion' },
    { label: 'Entrada por devolución', key: 'DevolucionesVenta' },
    { label: 'Entrada especial', key: 'EntradaEspecial' },
    { label: 'Ajuste Entrada Transf', key: 'AjusteEntradaTraspaso' },
    { label: 'Ajuste positivo', key: 'AjustePositivo' },
    { label: 'Entrada cancelación', key: 'EntradaCancelacionSeparado' },
    { label: 'Entrada merma sucursal', key: 'EntradaMermaSucursal' },
    { label: 'Total de entradas', key: 'TotalEntradas' },
  ];

  readonly salidasConfig: MovimientoConfig[] = [
    { label: 'Salida por venta', key: 'Ventas' },
    { label: 'Salida por traspaso', key: 'SalidasTraspaso' },
    { label: 'Salida por conversión', key: 'SalidasConversion' },
    { label: 'Salida por merma', key: 'SalidasMermas' },
    { label: 'Salida por consumo interno', key: 'SalidasConsumo' },
    { label: 'Salida por devolución', key: 'SalidasDevolucion' },
    { label: 'Salida especial', key: 'SalidaEspecial' },
    { label: 'Salida separado', key: 'SalidaSeparado' },
    { label: 'Salida cancelación entrada', key: 'SalidaCancelacionEntrada' },
    { label: 'Ajuste negativo', key: 'AjusteNegativo' },
    { label: 'Pruebas', key: 'Pruebas' },
    { label: 'Ajuste transf', key: 'AjusteSalidaTraspaso' },
    { label: 'Total de salidas', key: 'TotalSalidas' },
  ];

  readonly verificadorForm = this.fb.group({
    sucursalId: ['', Validators.required],
    codigo: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get descripcionArticulo(): string {
    return this.resultado?.Descripcion ?? '';
  }

  get teoricoCalculado(): number | null {
    return this.resultado?.Existencia ?? null;
  }

  get inventarioInicial(): number | null {
    return this.resultado?.InventarioInicial ?? null;
  }

  valorMovimiento(key: MovimientoConfig['key']): number {
    if (!this.resultado) {
      return 0;
    }
    return this.resultado[key] ?? 0;
  }

  trackByMovimiento(_: number, item: MovimientoConfig): string {
    return item.key;
  }

  onSubmit(): void {
    if (this.verificadorForm.invalid) {
      this.verificadorForm.markAllAsTouched();
      return;
    }

    const { sucursalId, codigo, fechaInicio, fechaFin } = this.verificadorForm.getRawValue();
    const payload: VerificadorInventarioPayload = {
      Codigo: (codigo ?? '').trim(),
      IdSucursal: (sucursalId ?? '').trim(),
      FechaInicial: fechaInicio ?? '',
      FechaFinal: fechaFin ?? '',
    };

    this.isLoading = true;
    this.errorMessage = null;
    this.resultado = undefined;
    this.consultaCompletada = false;
    this.inventariosService
      .obtenerVerificadorInventario(payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.resultado = response;
          this.consultaCompletada = true;
          this.lastCriteria = {
            sucursalId: payload.IdSucursal,
            codigo: payload.Codigo,
            fechaInicio: payload.FechaInicial,
            fechaFin: payload.FechaFinal,
          };
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        },
      });
  }
}
