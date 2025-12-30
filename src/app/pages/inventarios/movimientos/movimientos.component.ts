import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  movimientoContext: { sucursal: string; tipoMovimiento: string } | null = null;
  renglones: RenglonMovimiento[] = [];
  renglonesLoading = false;
  renglonesError = '';

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
        this.movimientoId = id;
        this.movimientoFolio = folio;
        this.movimientoContext = {
          sucursal: String(sucursal),
          tipoMovimiento: tipoMovimiento,
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

  private getTipoMovimientoLabel(value: string): string {
    return this.tiposMovimiento.find((item) => item.value === value)?.label || value;
  }
}
