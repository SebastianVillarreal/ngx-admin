import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap } from 'rxjs/operators';

import {
  AutocompleteArticuloOption,
  ExistenciaArticulo,
  InventariosService,
  RenglonMovimiento,
} from '../inventarios.service';

interface SelectOption {
  value: string;
  label: string;
}

interface ArticuloCatalogo {
  codigo: string;
  descripcion: string;
  unidad: string;
  existencia: string;
  costo?: number;
}

interface MovimientoContext {
  sucursal: string;
  tipoMovimiento: string;
  sucursalLabel?: string;
  tipoMovimientoLabel?: string;
  sentido?: string;
  sentidoLabel?: string;
  referencia?: string;
  fechaRegistro?: string;
}

interface MovimientoComprobanteInfo {
  folio: number;
  sucursal: string;
  tipo: string;
  sentido: string;
  referencia: string;
  fecha: string;
}

@Component({
  selector: 'ngx-inventarios-movimientos',
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.scss'],
})
export class MovimientosComponent implements OnInit, OnDestroy {
  movimientoForm: FormGroup;
  detalleForm: FormGroup;
  sucursales: SelectOption[] = [];
  sentidosMovimiento: SelectOption[] = [];
  tiposMovimiento: SelectOption[] = [];
  tiposMovimientoLoading = false;
  tiposMovimientoError = '';
  submitting = false;
  submissionMessage = '';
  movimientoId = 0;
  movimientoFolio = 0;
  private sentidoSub?: Subscription;
  private codigoSub?: Subscription;
  private descripcionSub?: Subscription;
  codigoOptions: ArticuloCatalogo[] = [];
  descripcionOptions: ArticuloCatalogo[] = [];
  codigoAutocompleteLoading = false;
  descripcionAutocompleteLoading = false;
  codigoAutocompleteError = '';
  descripcionAutocompleteError = '';
  detalleLoading = false;
  detalleError = '';
  detalleMensaje = '';
  detalleSubmitLoading = false;
  detalleArticuloInfo: ExistenciaArticulo | null = null;
  movimientoContext: MovimientoContext | null = null;
  renglones: RenglonMovimiento[] = [];
  renglonesLoading = false;
  renglonesError = '';
  finalizando = false;
  finalizacionMessage = '';
  finalizacionError = '';

  constructor(private readonly fb: FormBuilder, private readonly inventariosService: InventariosService) {
    this.movimientoForm = this.fb.group({
      sucursal: ['', Validators.required],
      sentido: ['', Validators.required],
      tipoMovimiento: ['', Validators.required],
      referencia: ['', [Validators.required, Validators.maxLength(120)]],
    });

    this.detalleForm = this.fb.group({
      codigo: ['', Validators.required],
      descripcion: ['', Validators.required],
      cantidad: [null, [Validators.required, Validators.min(0.01)]],
      unidadMedida: [{ value: '', disabled: true }],
      existencia: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.loadOptions();
    this.sentidoSub = this.movimientoForm.get('sentido')?.valueChanges.subscribe((sentido) => {
      this.onSentidoChange(sentido);
    });
    this.setupDetalleAutocomplete();
  }

  ngOnDestroy(): void {
    this.sentidoSub?.unsubscribe();
    this.codigoSub?.unsubscribe();
    this.descripcionSub?.unsubscribe();
  }

  loadOptions(): void {
    this.sucursales = [
      { value: '1', label: 'Matriz' },
      { value: '2', label: 'Sucursal Norte' },
      { value: '3', label: 'Sucursal Sur' },
    ];

    this.sentidosMovimiento = [
      { value: 'entrada', label: 'Entrada' },
      { value: 'salida', label: 'Salida' },
    ];

    this.tiposMovimiento = [];
    this.codigoOptions = [];
    this.descripcionOptions = [];
  }

  private setupDetalleAutocomplete(): void {
    const codigoCtrl = this.detalleForm.get('codigo');
    if (codigoCtrl) {
      this.codigoSub = codigoCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((term: string) => this.fetchArticulos(term, 'codigo')),
        )
        .subscribe({
          next: (options) => {
            this.codigoOptions = options;
          },
          error: (err) => {
            this.codigoAutocompleteError = err?.message || 'No se pudieron obtener los artículos.';
            this.codigoOptions = [];
          },
        });
    }

    const descripcionCtrl = this.detalleForm.get('descripcion');
    if (descripcionCtrl) {
      this.descripcionSub = descripcionCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((term: string) => this.fetchArticulos(term, 'descripcion')),
        )
        .subscribe({
          next: (options) => {
            this.descripcionOptions = options;
          },
          error: (err) => {
            this.descripcionAutocompleteError = err?.message || 'No se pudieron obtener los artículos.';
            this.descripcionOptions = [];
          },
        });
    }
  }

  private fetchArticulos(term: string, target: 'codigo' | 'descripcion') {
    const trimmed = (term || '').trim();
    const minLength = 2;
    if (!trimmed || trimmed.length < minLength) {
      this.setAutocompleteOptions(target, []);
      this.setAutocompleteLoading(target, false);
      this.setAutocompleteError(target, '');
      return of([] as ArticuloCatalogo[]);
    }

    this.setAutocompleteLoading(target, true);
    this.setAutocompleteError(target, '');
    return this.inventariosService.autocompleteArticulos(trimmed).pipe(
      map((options) => options.map((option) => this.normalizeArticuloOption(option))),
      finalize(() => this.setAutocompleteLoading(target, false)),
    );
  }

  private setAutocompleteOptions(target: 'codigo' | 'descripcion', options: ArticuloCatalogo[]): void {
    if (target === 'codigo') {
      this.codigoOptions = options;
    } else {
      this.descripcionOptions = options;
    }
  }

  private setAutocompleteLoading(target: 'codigo' | 'descripcion', loading: boolean): void {
    if (target === 'codigo') {
      this.codigoAutocompleteLoading = loading;
    } else {
      this.descripcionAutocompleteLoading = loading;
    }
  }

  private setAutocompleteError(target: 'codigo' | 'descripcion', message: string): void {
    if (target === 'codigo') {
      this.codigoAutocompleteError = message;
    } else {
      this.descripcionAutocompleteError = message;
    }
  }

  private normalizeArticuloOption(option: AutocompleteArticuloOption): ArticuloCatalogo {
    const [codePart, ...rest] = option.label.split(' - ');
    const descripcion = rest.length ? rest.join(' - ').trim() : option.label;
    return {
      codigo: option.value || codePart?.trim() || '',
      descripcion: descripcion || option.label,
      unidad: '---',
      existencia: '---',
    };
  }

  onCodigoSelected(articulo: ArticuloCatalogo): void {
    this.applyArticuloSelection(articulo);
  }

  onDescripcionSelected(articulo: ArticuloCatalogo): void {
    this.applyArticuloSelection(articulo);
  }

  private applyArticuloSelection(articulo: ArticuloCatalogo): void {
    this.detalleForm.patchValue(
      {
        codigo: articulo.codigo,
        descripcion: articulo.descripcion,
        unidadMedida: articulo.unidad,
        existencia: articulo.existencia,
      },
      { emitEvent: false },
    );
    this.fetchArticuloDetalles(articulo.codigo);
  }

  private fetchArticuloDetalles(codigo: string): void {
    if (!codigo) {
      return;
    }

    const sucursal = this.movimientoForm.get('sucursal')?.value || this.movimientoContext?.sucursal;
    if (!sucursal) {
      this.detalleError = 'Selecciona una sucursal antes de capturar el detalle.';
      return;
    }

    this.detalleLoading = true;
    this.detalleError = '';
    this.detalleArticuloInfo = null;
    this.inventariosService.obtenerExistenciaArticulo(codigo, String(sucursal)).subscribe({
      next: (info) => {
        this.detalleLoading = false;
        if (!info) {
          this.detalleError = 'No se encontró información del artículo.';
          return;
        }
        this.applyArticuloInfo(info);
      },
      error: (err) => {
        this.detalleLoading = false;
        this.detalleError = err?.message || 'No se pudo obtener la existencia del artículo.';
      },
    });
  }

  private applyArticuloInfo(info: ExistenciaArticulo): void {
    this.detalleArticuloInfo = info;
    this.detalleForm.patchValue(
      {
        codigo: info.Codigo,
        descripcion: info.Descripcion,
        unidadMedida: info.UMedida || '---',
        existencia: info.Existencia?.toString() ?? '0',
      },
      { emitEvent: false },
    );
  }

  agregarDetalle(): void {
    this.detalleMensaje = '';
    this.detalleError = '';
    if (!this.movimientoId || !this.movimientoFolio || !this.movimientoContext) {
      this.detalleError = 'Genera y guarda el movimiento antes de capturar el detalle.';
      return;
    }

    if (this.detalleForm.invalid) {
      this.detalleForm.markAllAsTouched();
      return;
    }

    const detalleValues = this.detalleForm.getRawValue();
    const cantidad = Number(detalleValues.cantidad);
    if (!cantidad || cantidad <= 0) {
      this.detalleError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    const precio = this.detalleArticuloInfo?.Costo ?? 0;
    const payload = {
      IdSucursal: this.movimientoContext.sucursal,
      Folio: String(this.movimientoFolio),
      Tipo: this.movimientoContext.tipoMovimiento,
      Articulo: detalleValues.codigo,
      Precio: precio.toString(),
      Cantidad: cantidad.toString(),
      IdMovimiento: this.movimientoId.toString(),
    };

    this.detalleSubmitLoading = true;
    this.inventariosService.insertRenglonMovimiento(payload).subscribe({
      next: () => {
        this.detalleSubmitLoading = false;
        this.detalleMensaje = 'Detalle agregado correctamente.';
        this.detalleForm.reset();
        this.detalleArticuloInfo = null;
        this.loadRenglones();
      },
      error: (err) => {
        this.detalleSubmitLoading = false;
        this.detalleError = err?.message || 'No se pudo agregar el detalle.';
      },
    });
  }

  finalizarMovimiento(): void {
    this.finalizacionError = '';
    this.finalizacionMessage = '';
    if (!this.movimientoId || !this.movimientoFolio) {
      this.finalizacionError = 'Genera y guarda un movimiento antes de finalizarlo.';
      return;
    }

    if (!this.renglones.length) {
      this.finalizacionError = 'Agrega al menos un artículo al movimiento antes de finalizarlo.';
      return;
    }

    if (!this.movimientoContext) {
      this.finalizacionError = 'No se encontró la información del movimiento en curso.';
      return;
    }

    this.finalizando = true;
    const folio = this.movimientoFolio;
    const detalleSnapshot = this.renglones.map((item) => ({ ...item }));
    const comprobanteInfo = this.buildComprobanteInfo(this.movimientoContext, folio);
    setTimeout(() => {
      try {
        this.generarComprobanteMovimientoPdf(comprobanteInfo, detalleSnapshot);
      } catch (error) {
        console.error('Error al generar el comprobante PDF', error);
        this.finalizacionError = 'Movimiento finalizado, pero no se pudo generar el comprobante en PDF.';
      }
      this.resetMovimientoState();
      this.finalizando = false;
      this.finalizacionMessage = `Movimiento ${folio} finalizado.`;
    }, 400);
  }

  private buildComprobanteInfo(context: MovimientoContext, folio: number): MovimientoComprobanteInfo {
    return {
      folio,
      sucursal: context.sucursalLabel || context.sucursal,
      tipo: context.tipoMovimientoLabel || context.tipoMovimiento,
      sentido: context.sentidoLabel || context.sentido || '',
      referencia: context.referencia || '',
      fecha: context.fechaRegistro
        ? this.formatFechaParaComprobante(new Date(context.fechaRegistro))
        : this.formatFechaParaComprobante(new Date()),
    };
  }

  private formatFechaParaComprobante(date: Date): string {
    return date.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private generarComprobanteMovimientoPdf(
    info: MovimientoComprobanteInfo,
    renglones: RenglonMovimiento[],
  ): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Comprobante de Movimiento', 105, 16, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Folio: ${info.folio}`, 15, 30);
    doc.text(`Fecha: ${info.fecha}`, 105, 30);
    doc.text(`Sucursal: ${info.sucursal}`, 15, 38);
    doc.text(`Tipo: ${info.tipo}`, 105, 38);
    doc.text(`Sentido: ${info.sentido || 'N/A'}`, 15, 46);
    doc.text(`Referencia: ${info.referencia || 'N/A'}`, 15, 54);

    doc.setFontSize(12);
    doc.text('Detalle de artículos', 15, 68);

    doc.setFontSize(10);
    let cursorY = 74;
    doc.text('Código', 15, cursorY);
    doc.text('Descripción', 60, cursorY);
    doc.text('Cantidad', 195, cursorY, { align: 'right' });
    cursorY += 6;

    if (!renglones.length) {
      doc.text('Sin artículos registrados.', 15, cursorY);
    } else {
      renglones.forEach((item) => {
        if (cursorY > 270) {
          doc.addPage();
          cursorY = 20;
          doc.text('Código', 15, cursorY);
          doc.text('Descripción', 60, cursorY);
          doc.text('Cantidad', 195, cursorY, { align: 'right' });
          cursorY += 6;
        }
        doc.text(item.Articulo, 15, cursorY);
        doc.text(this.truncateText(item.Descripcion, 70), 60, cursorY);
        doc.text(this.formatCantidad(item.Cantidad), 195, cursorY, { align: 'right' });
        cursorY += 6;
      });
    }

    doc.save(`Comprobante-Mov-${info.folio}.pdf`);
  }

  private truncateText(text: string, maxLength = 70): string {
    if (!text) {
      return '';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  private formatCantidad(value: number): string {
    const numeric = Number(value) || 0;
    return numeric.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  loadRenglones(): void {
    if (!this.movimientoFolio || !this.movimientoContext) {
      this.renglones = [];
      return;
    }

    const payload = {
      Folio: String(this.movimientoFolio),
      Tipo: this.movimientoContext.tipoMovimiento,
      IdSucursal: this.movimientoContext.sucursal,
      Historico: '0',
    };

    this.renglonesLoading = true;
    this.renglonesError = '';
    this.inventariosService.fetchRenglonesMovimiento(payload).subscribe({
      next: (rows) => {
        this.renglones = rows;
        this.renglonesLoading = false;
      },
      error: (err) => {
        this.renglonesLoading = false;
        this.renglonesError = err?.message || 'No se pudieron cargar los artículos del movimiento.';
      },
    });
  }

  private onSentidoChange(sentido: string): void {
    this.movimientoForm.get('tipoMovimiento')?.reset();
    this.tiposMovimiento = [];
    this.tiposMovimientoError = '';
    if (!sentido) {
      return;
    }

    const tipoMovimientoClave = sentido === 'entrada' ? '1' : '2';
    this.tiposMovimientoLoading = true;

    this.inventariosService.fetchTipoMovimientos(tipoMovimientoClave).subscribe({
      next: (items) => {
        this.tiposMovimiento = (items || []).map((item) => ({
          value: item.Clave,
          label: item.Nombre,
        }));
        if (this.tiposMovimiento.length === 1) {
          this.movimientoForm.get('tipoMovimiento')?.setValue(this.tiposMovimiento[0].value);
        }
        this.tiposMovimientoLoading = false;
      },
      error: (err) => {
        this.tiposMovimientoLoading = false;
        this.tiposMovimientoError = err?.message || 'No se pudo cargar el catálogo de tipos.';
      },
    });
  }

  submitMovimiento(): void {
    this.submissionMessage = '';
    this.finalizacionMessage = '';
    this.finalizacionError = '';
    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submissionMessage = '';
    this.movimientoId = 0;
    this.movimientoFolio = 0;
    const { sucursal, sentido, tipoMovimiento, referencia } = this.movimientoForm.value;
    const payload = {
      IdSucursal: Number(sucursal),
      TipoMovimiento: tipoMovimiento,
      UsuarioEntrega: 1,
      ClaveProveedor: 6,
      Referencia: referencia,
      Nota: '',
    };

    this.inventariosService.insertMovimiento(payload).subscribe({
      next: ({ id, folio }) => {
        this.submitting = false;
        const tipoLabel = this.getTipoMovimientoLabel(tipoMovimiento);
        const sucursalLabel = this.getOptionLabel(this.sucursales, String(sucursal));
        const sentidoLabel = this.getOptionLabel(this.sentidosMovimiento, sentido);
        const fechaRegistro = new Date().toISOString();
        this.movimientoId = id;
        this.movimientoFolio = folio;
        this.movimientoContext = {
          sucursal: String(sucursal),
          tipoMovimiento: tipoMovimiento,
          sucursalLabel,
          tipoMovimientoLabel: tipoLabel,
          sentido: sentido ?? '',
          sentidoLabel,
          referencia: referencia ?? '',
          fechaRegistro,
        };
        this.submissionMessage = `Movimiento ${sentido} registrado en la sucursal ${sucursal} con tipo ${tipoLabel}.`;
        this.movimientoForm.reset();
        this.loadRenglones();
      },
      error: (err) => {
        this.submitting = false;
        this.submissionMessage = err?.message || 'No se pudo registrar el movimiento.';
      },
    });
  }

  private getOptionLabel(options: SelectOption[], value?: string | null): string {
    if (!value) {
      return '';
    }
    return options.find((item) => item.value === value)?.label || value;
  }

  private getTipoMovimientoLabel(value: string): string {
    return this.tiposMovimiento.find((item) => item.value === value)?.label || value;
  }

  private resetMovimientoState(): void {
    this.movimientoForm.reset();
    this.movimientoForm.markAsPristine();
    this.movimientoForm.markAsUntouched();
    this.detalleForm.reset();
    this.detalleForm.markAsPristine();
    this.detalleForm.markAsUntouched();
    this.detalleForm.get('unidadMedida')?.disable({ emitEvent: false });
    this.detalleForm.get('existencia')?.disable({ emitEvent: false });
    this.movimientoId = 0;
    this.movimientoFolio = 0;
    this.movimientoContext = null;
    this.detalleArticuloInfo = null;
    this.detalleMensaje = '';
    this.detalleError = '';
    this.submissionMessage = '';
    this.tiposMovimiento = [];
    this.tiposMovimientoError = '';
    this.codigoOptions = [];
    this.descripcionOptions = [];
    this.renglones = [];
    this.renglonesError = '';
  }
}
