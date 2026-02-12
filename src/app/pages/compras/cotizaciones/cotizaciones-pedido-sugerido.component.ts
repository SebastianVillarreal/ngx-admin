import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CotizacionesService } from './cotizaciones.service';

@Component({
  selector: 'ngx-cotizaciones-pedido-sugerido',
  templateUrl: './cotizaciones-pedido-sugerido.component.html',
  styleUrls: ['./cotizaciones-pedido-sugerido.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesPedidoSugeridoComponent {
  readonly filtrosForm = this.fb.group({
    fechaInicial: this.fb.control(this.getDateOffset(-30), Validators.required),
    fechaFinal: this.fb.control(this.getDateOffset(0), Validators.required),
    fechaExistencia: this.fb.control(this.getDateOffset(0), Validators.required),
  });

  descargando = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly cotizacionesService: CotizacionesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  onDescargar(): void {
    this.error = '';
    if (this.filtrosForm.invalid) {
      this.filtrosForm.markAllAsTouched();
      return;
    }

    const { fechaInicial, fechaFinal, fechaExistencia } = this.filtrosForm.getRawValue();
    if (!fechaInicial || !fechaFinal || !fechaExistencia) {
      return;
    }

    if (fechaInicial > fechaFinal) {
      this.error = 'La fecha inicial no puede ser mayor que la fecha final.';
      this.cdr.markForCheck();
      return;
    }

    this.descargando = true;
    this.cotizacionesService
      .descargarPedidoSugerido(fechaInicial, fechaFinal, fechaExistencia)
      .pipe(
        finalize(() => {
          this.descargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          const fileName = this.getFileNameFromResponse(response.headers.get('content-disposition'))
            || `pedido-sugerido-${fechaExistencia}.xlsx`;
          this.descargarBlob(response.body, fileName);
        },
        error: (errorObj: Error) => {
          this.error = errorObj.message || 'No se pudo descargar el archivo.';
        },
      });
  }

  onReintentar(): void {
    this.onDescargar();
  }

  private descargarBlob(blob: Blob | null, fileName: string): void {
    if (!blob) {
      this.error = 'El servicio no devolvió un archivo.';
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private getFileNameFromResponse(contentDisposition: string | null): string {
    if (!contentDisposition) {
      return '';
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]).replace(/["']/g, '').trim();
    }

    const asciiMatch = contentDisposition.match(/filename=([^;]+)/i);
    if (!asciiMatch?.[1]) {
      return '';
    }

    return asciiMatch[1].replace(/["']/g, '').trim();
  }

  private getDateOffset(offsetDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
