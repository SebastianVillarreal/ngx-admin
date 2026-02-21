import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CreditosService } from '../creditos.service';

type CorteAbonosForm = {
  usuario: FormControl<string>;
  fecha: FormControl<string>;
};

@Component({
  selector: 'ngx-corte-abonos',
  templateUrl: './corte-abonos.component.html',
  styleUrls: ['./corte-abonos.component.scss'],
})
export class CorteAbonosComponent implements OnInit {
  form: FormGroup<CorteAbonosForm>;
  usuarios: Array<{ value: string; label: string }> = [];
  usuariosLoading = false;
  usuariosError = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly creditosService: CreditosService,
  ) {
    this.form = this.fb.nonNullable.group({
      usuario: '',
      fecha: '',
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.form.patchValue({
      fecha: this.formatForInput(today),
    });
    this.cargarUsuarios();
  }

  exportar(): void {
    // TODO: Integrar servicio real para generar corte de abonos
    console.log('Exportar corte de abonos', this.form.value);
  }

  reintentarUsuarios(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.usuariosLoading = true;
    this.usuariosError = '';
    this.usuarios = [];

    this.creditosService
      .fetchUsuariosCorteAbonos()
      .pipe(
        finalize(() => {
          this.usuariosLoading = false;
        }),
      )
      .subscribe({
        next: (items) => {
          this.usuarios = (items || []).map((usuario) => ({
            value: String(usuario.IdUsuario),
            label: usuario.NombreUsuario,
          }));

          const currentValue = this.form.controls.usuario.value;
          const currentValueExists = this.usuarios.some((item) => item.value === currentValue);
          if (!currentValueExists) {
            this.form.patchValue({ usuario: this.usuarios[0]?.value ?? '' });
          }
        },
        error: (error: Error) => {
          this.usuariosError = error.message;
          this.form.patchValue({ usuario: '' });
        },
      });
  }

  private formatForInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
