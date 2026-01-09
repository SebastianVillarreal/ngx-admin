import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { TraspasosService, ExistenciaInventario } from '../traspasos/traspasos.service';

interface SeleccionOption {
  value: string;
  label: string;
}

interface FiltroFormValue {
  departamento: string;
  familia: string;
  fecha: string;
}

@Component({
  selector: 'ngx-existencias-inventario',
  templateUrl: './existencias.component.html',
  styleUrls: ['./existencias.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExistenciasComponent implements OnInit {
  readonly departamentos: SeleccionOption[] = [
    { value: '1041', label: 'Lácteos (01)' },
    { value: '2001', label: 'Abarrotes (02)' },
    { value: '3001', label: 'Carnes (03)' },
  ];

  readonly familias: SeleccionOption[] = [
    { value: '1013', label: 'Natillas' },
    { value: '2020', label: 'Conservas' },
    { value: '3030', label: 'Embutidos' },
  ];

  readonly filtroForm = this.fb.group({
    departamento: this.fb.control(this.departamentos[0]?.value ?? '', Validators.required),
    familia: this.fb.control(this.familias[0]?.value ?? '', Validators.required),
    fecha: this.fb.control('', Validators.required),
  });

  cargando = false;
  mensaje = '';
  error = '';
  existencias: ExistenciaInventario[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.establecerFechaInicial();
  }

  onBuscar(): void {
    this.mensaje = '';
    this.error = '';

    if (this.filtroForm.invalid) {
      this.filtroForm.markAllAsTouched();
      this.error = 'Completa el departamento, la familia y la fecha para continuar.';
      this.markForCheck();
      return;
    }

    const { departamento, familia, fecha } = this.filtroForm.value as FiltroFormValue;
    const nombreDepartamento = this.obtenerEtiqueta(this.departamentos, departamento);
    const nombreFamilia = this.obtenerEtiqueta(this.familias, familia);

    this.cargando = true;
    this.existencias = [];
    this.markForCheck();

    this.traspasosService.obtenerExistencias(familia, departamento, fecha).subscribe({
      next: (existencias) => {
        this.existencias = existencias;
        this.mensaje = existencias.length
          ? `Se encontraron ${existencias.length} producto(s) del departamento ${nombreDepartamento} y familia ${nombreFamilia} con existencias registradas el ${fecha}.`
          : `No se registraron existencias para el departamento ${nombreDepartamento} y la familia ${nombreFamilia} el ${fecha}.`;
        this.cargando = false;
        this.markForCheck();
      },
      error: (error) => {
        this.error = error?.message ?? 'No se pudieron obtener las existencias.';
        this.cargando = false;
        this.markForCheck();
      },
    });
  }

  private establecerFechaInicial(): void {
    const hoy = new Date();
    this.filtroForm.patchValue({
      fecha: this.formatearFecha(hoy),
    });
    this.markForCheck();
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private obtenerEtiqueta(opciones: SeleccionOption[], valor: string): string {
    return opciones.find((opcion) => opcion.value === valor)?.label ?? 'la opción seleccionada';
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }
}
