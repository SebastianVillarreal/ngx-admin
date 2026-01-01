import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'ngx-reparto-mermas',
  templateUrl: './reparto-mermas.component.html',
  styleUrls: ['./reparto-mermas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepartoMermasComponent {
  readonly filtrosForm = this.fb.group({
    fechaVentasInicio: this.fb.control('', Validators.required),
    fechaVentasFin: this.fb.control('', Validators.required),
    fechaMermasInicio: this.fb.control('', Validators.required),
    fechaMermasFin: this.fb.control('', Validators.required),
  });

  buscando = false;
  generandoNotas = false;
  mensajeInfo = '';
  mensajeError = '';

  constructor(private readonly fb: FormBuilder, private readonly cdr: ChangeDetectorRef) {}

  onBuscar(): void {
    this.resetMensajes();
    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      this.mensajeError = 'Completa los cuatro filtros de fecha antes de buscar.';
      return;
    }

    this.buscando = true;
    setTimeout(() => {
      this.buscando = false;
      const { fechaVentasInicio, fechaVentasFin, fechaMermasInicio, fechaMermasFin } = this.filtrosForm.getRawValue();
      this.mensajeInfo = `Consulta lista para ventas del ${this.formatearFecha(fechaVentasInicio)} al ${this.formatearFecha(
        fechaVentasFin,
      )} y mermas del ${this.formatearFecha(fechaMermasInicio)} al ${this.formatearFecha(fechaMermasFin)}.`;
      this.cdr.markForCheck();
    }, 600);
  }

  onGenerarNotas(): void {
    this.resetMensajes();
    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      this.mensajeError = 'Captura las fechas antes de generar las notas.';
      return;
    }

    this.generandoNotas = true;
    setTimeout(() => {
      this.generandoNotas = false;
      this.mensajeInfo = 'Las notas de reparto de mermas se generaron correctamente.';
      this.cdr.markForCheck();
    }, 800);
  }

  private resetMensajes(): void {
    this.mensajeInfo = '';
    this.mensajeError = '';
  }

  private formatearFecha(valor: string | null | undefined): string {
    if (!valor) {
      return '---';
    }
    return new Date(valor).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}
