import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap } from 'rxjs/operators';

import {
  CotizacionesService,
  DetalleCotizacionItem,
  ProveedorDto,
} from './cotizaciones.service';
import { AutocompleteArticuloOption, InventariosService } from '../../inventarios/inventarios.service';
import { exportMasterDetailPdf, PdfTableColumn } from '../../../@core/utils/master-detail-pdf.util';

interface ProveedorOption {
  value: string;
  label: string;
}

interface ArticuloOpcion {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'ngx-cotizaciones-compras',
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesComponent implements OnInit, OnDestroy {
  @ViewChild('codigoInput') codigoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cantidadInput') cantidadInput?: ElementRef<HTMLInputElement>;
  @ViewChild('costoInput') costoInput?: ElementRef<HTMLInputElement>;

  readonly cotizacionForm = this.fb.group({
    proveedor: this.fb.control('', Validators.required),
    sucursal: this.fb.control('', Validators.required),
    fechaLlegada: this.fb.control('', Validators.required),
  });

  readonly detalleForm = this.fb.group({
    codigo: this.fb.control('', Validators.required),
    descripcion: this.fb.control('', Validators.required),
    cantidad: this.fb.control(1, [Validators.required, Validators.min(0.01)]),
    costo: this.fb.control(null, [Validators.required, Validators.min(0)]),
  });

  guardando = false;
  finalizando = false;
  agregandoDetalle = false;
  mensajeExito = '';
  mensajeError = '';
  mensajeFinalizacion = '';
  errorFinalizacion = '';

  proveedores: ProveedorOption[] = [];
  proveedoresLoading = false;
  proveedoresError = '';
  folioCotizacion?: number;

  detalles: DetalleCotizacionItem[] = [];
  detalleLoading = false;
  detalleError = '';

  get totalRenglones(): number {
    return this.detalles.reduce((acc, item) => acc + (Number(item?.Total) || 0), 0);
  }

  codigoOptions: ArticuloOpcion[] = [];
  descripcionOptions: ArticuloOpcion[] = [];
  codigoAutocompleteLoading = false;
  descripcionAutocompleteLoading = false;
  codigoAutocompleteError = '';
  descripcionAutocompleteError = '';

  private codigoSub?: Subscription;
  private descripcionSub?: Subscription;

  readonly sucursales = [
    { value: '1', label: 'Matriz' },
    { value: '2', label: 'Sucursal Norte' },
    { value: '3', label: 'Sucursal Sur' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly cotizacionesService: CotizacionesService,
    private readonly inventariosService: InventariosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.setupDetalleAutocomplete();
  }

  ngOnDestroy(): void {
    this.codigoSub?.unsubscribe();
    this.descripcionSub?.unsubscribe();
  }

  onGuardar(): void {
    this.resetMensajes();
    if (this.cotizacionForm.invalid) {
      this.cotizacionForm.markAllAsTouched();
      this.mensajeError = 'Selecciona un proveedor y la fecha estimada de llegada.';
      return;
    }

    const { proveedor, sucursal } = this.cotizacionForm.getRawValue();
    if (!proveedor || !sucursal) {
      this.mensajeError = 'Selecciona un proveedor y una sucursal válidos.';
      return;
    }

    const payload = {
      IdSucursal: sucursal,
      IdProveedor: proveedor,
      IdUsuario: '1',
    };

    this.guardando = true;
    this.cotizacionesService
      .insertarCotizacion(payload)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (folio) => {
          this.folioCotizacion = folio;
          this.mensajeExito = `Cotización ${folio} guardada correctamente.`;
          this.cargarDetalle(folio);
        },
        error: (error: Error) => {
          this.mensajeError = error.message;
        },
      });
  }

  onFinalizar(): void {
    this.resetMensajes();
    if (!this.folioCotizacion) {
      this.errorFinalizacion = 'Guarda la cotización antes de finalizarla.';
      return;
    }

    if (!this.detalles.length) {
      this.errorFinalizacion = 'Agrega al menos un producto antes de finalizar.';
      return;
    }

    this.finalizando = true;
    const payload = {
      IdCotizacion: String(this.folioCotizacion),
      Estatus: '2',
      Usuario: '1',
    };

    this.cotizacionesService
      .finalizarCotizacion(payload)
      .pipe(
        finalize(() => {
          this.finalizando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.mensajeFinalizacion = `Cotización ${this.folioCotizacion} finalizada con éxito.`;
          this.generarPdfCotizacion();
          this.resetCotizacionState();
        },
        error: (error: Error) => {
          this.errorFinalizacion = error.message;
        },
      });
  }

  onAgregarDetalle(): void {
    this.resetMensajes();
    if (!this.folioCotizacion) {
      this.mensajeError = 'Primero guarda la cotización para obtener un folio.';
      return;
    }

    if (this.detalleForm.invalid) {
      this.detalleForm.markAllAsTouched();
      this.mensajeError = 'Completa los campos del detalle.';
      return;
    }

    const { codigo, descripcion, cantidad, costo } = this.detalleForm.getRawValue();
    if (!codigo || !descripcion || cantidad == null || costo === null || costo === undefined) {
      this.mensajeError = 'Completa los campos del detalle.';
      return;
    }

    const payload = {
      IdCotizacion: String(this.folioCotizacion),
      Codigo: String(codigo),
      Cantidad: String(cantidad),
      Costo: String(costo),
    };

    this.agregandoDetalle = true;
    this.cotizacionesService
      .insertarDetalleCotizacion(payload)
      .pipe(
        finalize(() => {
          this.agregandoDetalle = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.mensajeExito = 'Detalle agregado correctamente.';
          this.resetDetalleFormulario();
          this.cargarDetalle(this.folioCotizacion!);
          this.focusCodigoInput();
        },
        error: (error: Error) => {
          this.mensajeError = error.message;
        },
      });
  }

  onCodigoEnter(event: Event): void {
    event.preventDefault();
    const codigo = String(this.detalleForm.get('codigo')?.value || '').trim();
    const sucursal = String(this.cotizacionForm.get('sucursal')?.value || '').trim();

    if (!codigo) {
      return;
    }

    if (!sucursal) {
      this.mensajeError = 'Selecciona una sucursal antes de consultar el artículo.';
      return;
    }

    this.codigoAutocompleteError = '';
    this.codigoAutocompleteLoading = true;
    this.inventariosService
      .obtenerExistenciaArticulo(codigo, sucursal)
      .pipe(
        finalize(() => {
          this.codigoAutocompleteLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (item) => {
          if (!item) {
            this.codigoAutocompleteError = 'No se encontró información del artículo.';
            return;
          }
          this.detalleForm.patchValue(
            {
              codigo: item.Codigo || codigo,
              descripcion: item.Descripcion || '',
              costo: Number(item.Costo) || 0,
            },
            { emitEvent: false },
          );
          this.focusCantidadInput();
        },
        error: (error: Error) => {
          this.codigoAutocompleteError = error.message || 'No se pudo consultar el artículo.';
        },
      });
  }

  onCantidadEnter(event: Event): void {
    event.preventDefault();
    this.focusCostoInput();
  }

  onCostoEnter(event: Event): void {
    event.preventDefault();
    this.focusCodigoInput();
  }

  onRefrescarDetalle(): void {
    if (!this.folioCotizacion) {
      this.mensajeError = 'No hay folio para consultar el detalle.';
      return;
    }
    this.cargarDetalle(this.folioCotizacion);
  }

  private resetMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mensajeFinalizacion = '';
    this.errorFinalizacion = '';
  }


  private cargarProveedores(): void {
    this.proveedoresLoading = true;
    this.proveedoresError = '';
    this.cotizacionesService
      .obtenerProveedores()
      .pipe(
        finalize(() => {
          this.proveedoresLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.proveedores = this.mapProveedores(items);
          if (this.proveedores.length === 1) {
            this.cotizacionForm.get('proveedor')?.setValue(this.proveedores[0].value);
          }
        },
        error: (error: Error) => {
          this.proveedoresError = error.message;
        },
      });
  }

  private mapProveedores(items: ProveedorDto[]): ProveedorOption[] {
    return (items || []).map((item) => ({
      value: String(item.Id),
      label: item.nombre,
    }));
  }

  private setupDetalleAutocomplete(): void {
    const codigoCtrl = this.detalleForm.get('codigo');
    if (codigoCtrl) {
      this.codigoSub = codigoCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((term: string) => this.queryArticulos(term, 'codigo')),
        )
        .subscribe({
          next: (options) => {
            this.setAutocompleteOptions('codigo', options);
            this.cdr.markForCheck();
          },
          error: (error: Error) => {
            this.setAutocompleteOptions('codigo', []);
            this.setAutocompleteError('codigo', error.message || 'No se pudieron buscar artículos.');
            this.cdr.markForCheck();
          },
        });
    }

    const descripcionCtrl = this.detalleForm.get('descripcion');
    if (descripcionCtrl) {
      this.descripcionSub = descripcionCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((term: string) => this.queryArticulos(term, 'descripcion')),
        )
        .subscribe({
          next: (options) => {
            this.setAutocompleteOptions('descripcion', options);
            this.cdr.markForCheck();
          },
          error: (error: Error) => {
            this.setAutocompleteOptions('descripcion', []);
            this.setAutocompleteError('descripcion', error.message || 'No se pudieron buscar artículos.');
            this.cdr.markForCheck();
          },
        });
    }
  }

  private queryArticulos(term: string, target: 'codigo' | 'descripcion') {
    const value = (term || '').trim();
    if (!value || value.length < 2) {
      this.setAutocompleteOptions(target, []);
      this.setAutocompleteError(target, '');
      this.setAutocompleteLoading(target, false);
      return of([] as ArticuloOpcion[]);
    }

    this.setAutocompleteLoading(target, true);
    this.setAutocompleteError(target, '');
    return this.inventariosService.autocompleteArticulos(value).pipe(
      map((options) => options.map((option) => this.normalizeArticuloOption(option))),
      finalize(() => {
        this.setAutocompleteLoading(target, false);
        this.cdr.markForCheck();
      }),
    );
  }

  onCodigoOptionSelected(option: ArticuloOpcion): void {
    this.applyArticuloSelection(option);
  }

  onDescripcionOptionSelected(option: ArticuloOpcion): void {
    this.applyArticuloSelection(option);
  }

  private applyArticuloSelection(option: ArticuloOpcion): void {
    if (!option) {
      return;
    }
    this.detalleForm.patchValue(
      {
        codigo: option.codigo,
        descripcion: option.descripcion,
      },
      { emitEvent: false },
    );
    this.cdr.markForCheck();
  }

  private normalizeArticuloOption(option: AutocompleteArticuloOption): ArticuloOpcion {
    const label = option?.label || '';
    const [codePart, ...rest] = label.split(' - ');
    const descripcion = rest.length ? rest.join(' - ').trim() : label;
    return {
      codigo: (option?.value || codePart || '').trim(),
      descripcion: descripcion || label || '',
    };
  }

  private setAutocompleteOptions(target: 'codigo' | 'descripcion', options: ArticuloOpcion[]): void {
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

  private cargarDetalle(idCotizacion: number): void {
    if (!idCotizacion) {
      return;
    }

    this.detalleLoading = true;
    this.detalleError = '';
    this.cotizacionesService
      .obtenerDetalleCotizacion(String(idCotizacion))
      .pipe(
        finalize(() => {
          this.detalleLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.detalles = items;
        },
        error: (error: Error) => {
          this.detalleError = error.message;
        },
      });
  }


  private resetDetalleFormulario(): void {
    this.detalleForm.reset({
      codigo: '',
      descripcion: '',
      cantidad: 1,
      costo: null,
    });
    this.codigoOptions = [];
    this.descripcionOptions = [];
    this.codigoAutocompleteError = '';
    this.descripcionAutocompleteError = '';
  }

  private resetCotizacionState(): void {
    this.cotizacionForm.reset({
      proveedor: '',
      sucursal: '',
      fechaLlegada: '',
    });
    this.resetDetalleFormulario();
    this.detalles = [];
    this.folioCotizacion = undefined;
  }

  private generarPdfCotizacion(): void {
    if (!this.detalles.length || !this.folioCotizacion) {
      return;
    }

    const authUser = this.getAuthUserData();
    const folio = String(this.folioCotizacion);
    const proveedor = this.getProveedorLabel(this.cotizacionForm.get('proveedor')?.value);
    const sucursal = this.getSucursalLabel(this.cotizacionForm.get('sucursal')?.value);
    const fechaLlegada = this.cotizacionForm.get('fechaLlegada')?.value || '-';
    const usuario = this.pickString(authUser, ['Nombre', 'Usuario', 'UserName', 'username']) || 'N/D';
    const tiendaNombre = this.pickString(authUser, ['NombreSucursal', 'Sucursal', 'sucursal']) || sucursal;
    const tiendaId = this.pickString(authUser, ['IdSucursal', 'idSucursal']) || 'N/D';

    const columns: PdfTableColumn<DetalleCotizacionItem>[] = [
      { header: 'Codigo', width: 28, value: (row) => String(row?.Codigo || '-') },
      { header: 'Descripcion', width: 78, value: (row) => String(row?.Descripcion || '-') },
      { header: 'Cant.', width: 20, align: 'right', value: (row) => this.formatNumber(row?.Cantidad) },
      { header: 'Costo', width: 28, align: 'right', value: (row) => this.formatCurrency(row?.Costo) },
      { header: 'Total', width: 32, align: 'right', value: (row) => this.formatCurrency(row?.Total) },
    ];

    exportMasterDetailPdf({
      fileName: `cotizacion-${folio}.pdf`,
      title: 'COTIZACION DE COMPRA',
      folio,
      store: `${tiendaNombre} (ID ${tiendaId})`,
      user: usuario,
      generatedAt: new Date().toLocaleString('es-MX'),
      masterTitle: 'Datos generales',
      detailTitle: 'Detalle',
      logoPlaceholderText: 'LOGO',
      footerNote: 'Documento generado automaticamente desde el modulo de compras.',
      masterFieldsLeft: [
        { label: 'Proveedor', value: proveedor },
        { label: 'Sucursal', value: sucursal },
        { label: 'Fecha llegada', value: fechaLlegada },
      ],
      masterFieldsRight: [
        { label: 'Folio visible', value: folio },
        { label: 'Usuario captura', value: usuario },
        { label: 'Renglones', value: String(this.detalles.length) },
      ],
      columns,
      rows: this.detalles,
      totalLabel: 'TOTAL',
      totalValue: this.formatCurrency(this.totalRenglones),
    });
  }

  private getProveedorLabel(value: string | null | undefined): string {
    const match = this.proveedores.find((prov) => prov.value === value);
    return match?.label || 'Sin proveedor';
  }

  private getSucursalLabel(value: string | null | undefined): string {
    const match = this.sucursales.find((sucursal) => sucursal.value === value);
    return match?.label || 'Sin sucursal';
  }

  private getAuthUserData(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private pickString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) {
        continue;
      }
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
    return '';
  }

  private formatCurrency(value: unknown): string {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatNumber(value: unknown): string {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private focusCodigoInput(): void {
    setTimeout(() => {
      this.codigoInput?.nativeElement.focus();
      this.codigoInput?.nativeElement.select();
    }, 0);
  }

  private focusCantidadInput(): void {
    setTimeout(() => {
      this.cantidadInput?.nativeElement.focus();
      this.cantidadInput?.nativeElement.select();
    }, 0);
  }

  private focusCostoInput(): void {
    setTimeout(() => {
      this.costoInput?.nativeElement.focus();
      this.costoInput?.nativeElement.select();
    }, 0);
  }

}


