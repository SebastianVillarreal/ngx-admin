import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { TraspasosService, TraspasoConDiferencia } from '../traspasos/traspasos.service';

interface SucursalOption {
  value: string;
  label: string;
}

interface FiltroFormValue {
  sucursal: string;
  fechaInicial: string;
  fechaFinal: string;
}

@Component({
  selector: 'ngx-traspasos-con-diferencia',
  templateUrl: './traspasos-con-diferencia.component.html',
  styleUrls: ['./traspasos-con-diferencia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraspasosConDiferenciaComponent implements OnInit {
  readonly sucursales: SucursalOption[] = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  readonly filtroForm = this.fb.group({
    sucursal: this.fb.control('1', Validators.required),
    fechaInicial: this.fb.control('', Validators.required),
    fechaFinal: this.fb.control('', Validators.required),
  });

  cargando = false;
  mensaje = '';
  error = '';
  traspasos: TraspasoConDiferencia[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.establecerFechasIniciales();
  }

  onBuscar(): void {
    this.mensaje = '';
    this.error = '';

    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.error = 'Completa sucursal y rango de fechas para continuar.';
      this.markForCheck();
      return;
    }

    const { sucursal, fechaInicial, fechaFinal } = this.filtroForm.value as FiltroFormValue;

    if (new Date(fechaInicial) > new Date(fechaFinal)) {
      this.error = 'La fecha final debe ser mayor o igual a la fecha inicial.';
      this.markForCheck();
      return;
    }

    const nombreSucursal = this.obtenerNombreSucursal(sucursal);

    this.cargando = true;
    this.traspasos = [];
    this.markForCheck();

    this.traspasosService.obtenerTraspasosConDiferencia(fechaInicial, fechaFinal, sucursal).subscribe({
      next: (traspasos) => {
        this.traspasos = traspasos;
        this.mensaje = traspasos.length
          ? `Se encontraron ${traspasos.length} artículo(s) con diferencia en traspasos de ${nombreSucursal} entre ${fechaInicial} y ${fechaFinal}.`
          : `No se detectaron diferencias en traspasos de ${nombreSucursal} entre ${fechaInicial} y ${fechaFinal}.`;
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener los traspasos con diferencia.';
        this.cargando = false;
        this.markForCheck();
      },
    });
  }

  private establecerFechasIniciales(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.filtroForm.patchValue({
      fechaInicial: this.formatearFecha(inicioMes),
      fechaFinal: this.formatearFecha(hoy),
    });
    this.markForCheck();
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private obtenerNombreSucursal(valor: string): string {
    return this.sucursales.find((s) => s.value === valor)?.label ?? 'la sucursal seleccionada';
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
