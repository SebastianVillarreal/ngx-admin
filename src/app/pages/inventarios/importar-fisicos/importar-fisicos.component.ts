import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';

import {
  AplicarAjustesPorListaPayload,
  CodigoAjusteItem,
  ImportarCodigosAjustePayload,
  ImportarCodigosAjusteResponse,
  InventariosService,
} from '../inventarios.service';

@Component({
  selector: 'ngx-importar-fisicos',
  templateUrl: './importar-fisicos.component.html',
  styleUrls: ['./importar-fisicos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportarFisicosComponent {
  readonly importarFisicosForm = this.fb.group({
    fechaInventario: this.fb.control('', Validators.required),
    archivo: this.fb.control<File | null>(null, Validators.required),
  });
  mensajeExito = '';
  mensajeError = '';
  subiendo = false;
  aplicando = false;
  archivoCargado = false;
  resultadosPreview: ImportarCodigosAjusteResponse[] = [];
  private aplicarCodigosPayload: AplicarAjustesPorListaPayload | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get fechaControl() {
    return this.importarFisicosForm.get('fechaInventario');
  }

  get archivoControl() {
    return this.importarFisicosForm.get('archivo');
  }

  get archivoNombre(): string {
    const file = this.archivoControl?.value as File | null;
    return file?.name ?? '';
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.archivoControl?.setValue(file);
    this.archivoControl?.markAsTouched();
    this.archivoControl?.updateValueAndValidity();
    this.resetPreviewState();
    this.resetMensajes();
  }

  async onCargarArchivo(): Promise<void> {
    this.resetMensajes();
    this.resetPreviewState();
    if (this.importarFisicosForm.invalid) {
      this.importarFisicosForm.markAllAsTouched();
      this.mensajeError = 'Completa la fecha del inventario y selecciona un archivo para continuar.';
      return;
    }

    const fechaInventario = (this.fechaControl?.value as string | null) ?? '';
    const archivo = (this.archivoControl?.value as File | null) ?? null;

    if (!archivo) {
      this.mensajeError = 'Selecciona un archivo de Excel válido.';
      return;
    }

    this.subiendo = true;

    try {
      const codigos = await this.leerCodigosDesdeExcel(archivo);
      if (!codigos.length) {
        throw new Error('No se encontraron filas válidas a partir de la fila 2.');
      }

      const payload: ImportarCodigosAjustePayload = {
        Codigos: codigos,
        FechaInventario: fechaInventario,
      };

      this.inventariosService
        .cargarCodigosAjuste(payload)
        .pipe(
          finalize(() => {
            this.subiendo = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: (respuesta) => {
            this.resultadosPreview = respuesta;
            this.aplicarCodigosPayload = {
              Codigos: respuesta.map((item) => ({
                Codigo: item.Codigo,
                Cantidad: item.Fisico.toString(),
                Teorico: item.Teorico.toString(),
              })),
            };
            this.archivoCargado = true;
            this.mensajeExito = `Revisa los resultados del inventario del ${this.formatFecha(fechaInventario)} antes de aplicar.`;
          },
          error: (error: Error) => {
            this.mensajeError = error.message;
          },
        });
    } catch (error) {
      this.subiendo = false;
      this.mensajeError = error instanceof Error ? error.message : 'No se pudo leer el archivo seleccionado.';
      this.cdr.markForCheck();
    }
  }

  onAplicarAjuste(): void {
    this.resetMensajes();
    if (!this.archivoCargado || !this.aplicarCodigosPayload) {
      this.mensajeError = 'Carga y valida un archivo antes de aplicar el ajuste físico.';
      return;
    }

    this.aplicando = true;
    this.inventariosService
      .aplicarAjustesPorLista(this.aplicarCodigosPayload)
      .pipe(
        finalize(() => {
          this.aplicando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.mensajeExito = 'El ajuste del inventario físico se aplicó correctamente.';
          this.limpiarPantalla();
        },
        error: (error: Error) => {
          this.mensajeError = error.message;
        },
      });
  }

  private resetMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private resetPreviewState(): void {
    this.resultadosPreview = [];
    this.archivoCargado = false;
    this.aplicarCodigosPayload = null;
  }

  private limpiarPantalla(): void {
    this.importarFisicosForm.reset({
      fechaInventario: '',
      archivo: null,
    });
    this.resetPreviewState();
  }

  private formatFecha(value: string | null | undefined): string {
    if (!value) {
      return '---';
    }
    return new Date(value).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private async leerCodigosDesdeExcel(file: File): Promise<CodigoAjusteItem[]> {
    let workbook: XLSX.WorkBook;
    try {
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, { type: 'array' });
    } catch (error) {
      throw new Error('No se pudo interpretar el archivo de Excel proporcionado.');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('El archivo no contiene información disponible para procesar.');
    }

    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
      header: 1,
      raw: false,
      defval: null,
    });

    return rows
      .slice(1)
      .map((row) => this.mapRowToCodigo(row))
      .filter((item): item is CodigoAjusteItem => !!item && !!item.Codigo);
  }

  private mapRowToCodigo(row: Array<string | number | null>): CodigoAjusteItem | null {
    const codigo = this.sanitizarTexto(row[0]);
    const cantidad = this.sanitizarCantidad(row[1]);
    if (!codigo) {
      return null;
    }
    return {
      Codigo: codigo,
      Cantidad: cantidad,
    };
  }

  private sanitizarTexto(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '';
    }
    return String(valor).trim();
  }

  private sanitizarCantidad(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') {
      return '0';
    }
    const numero = Number(String(valor).replace(',', '.'));
    if (Number.isNaN(numero)) {
      return '0';
    }
    return numero.toString();
  }
}
