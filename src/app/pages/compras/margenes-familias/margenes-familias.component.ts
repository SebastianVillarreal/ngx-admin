import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { Familia, FamiliasService } from '../../catalogos/familias/familias.service';

interface FamiliaOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ngx-margenes-familias',
  templateUrl: './margenes-familias.component.html',
  styleUrls: ['./margenes-familias.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MargenesFamiliasComponent implements OnInit {
  readonly form = this.fb.group({
    familia: this.fb.control('', Validators.required),
    margenMinimo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    margenObjetivo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    margenMaximo: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  familias: FamiliaOption[] = [];
  familiasLoading = false;
  familiasError = '';
  mensaje = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly familiasService: FamiliasService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarFamilias();
  }

  onGuardar(): void {
    this.mensaje = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { margenMinimo, margenObjetivo, margenMaximo } = this.form.getRawValue();
    if (Number(margenMinimo) > Number(margenObjetivo) || Number(margenObjetivo) > Number(margenMaximo)) {
      this.mensaje = 'Valida el orden de márgenes: mínimo <= objetivo <= máximo.';
      return;
    }

    this.mensaje = 'Configuración de márgenes capturada. Pendiente de integración de guardado.';
  }

  onReintentar(): void {
    this.cargarFamilias();
  }

  private cargarFamilias(): void {
    this.familiasLoading = true;
    this.familiasError = '';
    this.familias = [];

    this.familiasService
      .fetchFamilias()
      .pipe(
        finalize(() => {
          this.familiasLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.familias = this.mapFamilias(items);
        },
        error: (error: Error) => {
          this.familiasError = error.message || 'No se pudo cargar el catálogo de familias.';
        },
      });
  }

  private mapFamilias(items: Familia[]): FamiliaOption[] {
    return (items || []).map((item) => ({
      value: String(item.Id),
      label: item.Nombre,
    }));
  }
}
