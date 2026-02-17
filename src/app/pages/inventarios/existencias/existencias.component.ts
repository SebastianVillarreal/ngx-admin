import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DepartamentosService } from '../../catalogos/departamentos/departamentos.service';
import { FamiliasService } from '../../catalogos/familias/familias.service';
import { ExistenciaInventario, TraspasosService } from '../traspasos/traspasos.service';

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
export class ExistenciasComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  departamentos: SeleccionOption[] = [];
  familias: SeleccionOption[] = [];

  readonly filtroForm = this.fb.group({
    departamento: this.fb.control('', Validators.required),
    familia: this.fb.control('', Validators.required),
    fecha: this.fb.control('', Validators.required),
  });

  cargando = false;
  departamentosLoading = false;
  departamentosError = '';
  familiasLoading = false;
  familiasError = '';
  mensaje = '';
  error = '';
  existencias: ExistenciaInventario[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly traspasosService: TraspasosService,
    private readonly departamentosService: DepartamentosService,
    private readonly familiasService: FamiliasService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.establecerFechaInicial();
    this.suscribirCambiosDepartamento();
    this.cargarDepartamentos();
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

  private cargarDepartamentos(): void {
    this.departamentosLoading = true;
    this.departamentosError = '';
    this.departamentos = [];
    this.markForCheck();

    this.departamentosService.fetchDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = (data || []).map((item) => ({
          value: String(item.Id),
          label: item.Nombre || `Departamento #${item.Id}`,
        }));
        this.filtroForm.patchValue({ departamento: this.departamentos[0]?.value ?? '' });
        this.departamentosLoading = false;
        this.markForCheck();
      },
      error: (error) => {
        this.departamentosLoading = false;
        this.departamentosError = error?.message || 'No se pudo cargar el catalogo de departamentos.';
        this.markForCheck();
      },
    });
  }

  private suscribirCambiosDepartamento(): void {
    this.filtroForm.get('departamento')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const idDepartamento = String(value || '').trim();
        this.cargarFamilias(idDepartamento);
      });
  }

  private cargarFamilias(idDepartamento: string): void {
    this.familiasLoading = true;
    this.familiasError = '';
    this.familias = [];
    this.filtroForm.patchValue({ familia: '' }, { emitEvent: false });
    this.markForCheck();

    if (!idDepartamento) {
      this.familiasLoading = false;
      this.markForCheck();
      return;
    }

    this.familiasService.fetchFamilias(idDepartamento).subscribe({
      next: (data) => {
        this.familias = (data || []).map((item) => ({
          value: String(item.Id),
          label: item.Nombre || `Familia #${item.Id}`,
        }));
        this.filtroForm.patchValue({ familia: this.familias[0]?.value ?? '' }, { emitEvent: false });
        this.familiasLoading = false;
        this.markForCheck();
      },
      error: (error) => {
        this.familiasLoading = false;
        this.familiasError = error?.message || 'No se pudo cargar el catalogo de familias.';
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
    return opciones.find((opcion) => opcion.value === valor)?.label ?? 'la opcion seleccionada';
  }

  private markForCheck(): void {
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
