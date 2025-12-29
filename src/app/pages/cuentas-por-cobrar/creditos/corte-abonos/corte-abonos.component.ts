import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

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
  usuarios: Array<{ value: string; label: string }> = [
    { value: '1', label: 'Administrador' },
    { value: '2', label: 'Cajero A' },
    { value: '3', label: 'Cajero B' },
  ];

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      usuario: '',
      fecha: '',
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.form.patchValue({
      usuario: this.usuarios[0]?.value ?? '',
      fecha: this.formatForInput(today),
    });
  }

  exportar(): void {
    // TODO: Integrar servicio real para generar corte de abonos
    console.log('Exportar corte de abonos', this.form.value);
  }

  private formatForInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
