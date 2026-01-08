import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { TraspasosService, TraspasoEnviado } from '../traspasos/traspasos.service';

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
  selector: 'ngx-traspasos-enviados',
  templateUrl: './traspasos-enviados.component.html',
  styleUrls: ['./traspasos-enviados.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraspasosEnviadosComponent implements OnInit {
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
  traspasos: TraspasoEnviado[] = [];

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

    this.traspasosService.obtenerTraspasosEnviados(sucursal, fechaInicial, fechaFinal).subscribe({
      next: (traspasos) => {
        this.traspasos = traspasos;
        this.mensaje = traspasos.length
          ? `Se encontraron ${traspasos.length} traspaso(s) enviados desde ${nombreSucursal} entre ${fechaInicial} y ${fechaFinal}.`
          : `No hay traspasos enviados desde ${nombreSucursal} entre ${fechaInicial} y ${fechaFinal}.`;
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener los traspasos enviados.';
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
