import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import {
  CotizacionesService,
  CotizacionResumen,
  DetalleCotizacionItem,
  ProveedorDto,
} from './cotizaciones.service';
import { exportMasterDetailPdf, PdfTableColumn } from '../../../@core/utils/master-detail-pdf.util';

interface ProveedorOption {
  value: string;
  label: string;
}

interface CotizacionPdfContext {
  folio: string;
  proveedor: string;
  comprador: string;
  fecha: string;
  fechaEstimada: string;
  estatus: string;
  tienda: string;
  generadoPor: string;
  fechaGeneracion: string;
}

@Component({
  selector: 'ngx-cotizaciones-lista',
  templateUrl: './cotizaciones-lista.component.html',
  styleUrls: ['./cotizaciones-lista.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesListaComponent implements OnInit {
  proveedores: ProveedorOption[] = [];
  proveedoresLoading = false;
  proveedoresError = '';

  proveedorSeleccionado = '';
  cotizaciones: CotizacionResumen[] = [];
  cotizacionesLoading = false;
  cotizacionesError = '';

  cotizacionSeleccionada?: CotizacionResumen;
  detalleSeleccionado: DetalleCotizacionItem[] = [];
  detalleLoading = false;
  detalleError = '';

  get totalDetalleSeleccionado(): number {
    return this.detalleSeleccionado.reduce((acc, item) => acc + (Number(item?.Total) || 0), 0);
  }

  constructor(
    private readonly cotizacionesService: CotizacionesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  onProveedorChange(proveedorId: string): void {
    this.proveedorSeleccionado = proveedorId || '';
    this.cotizacionSeleccionada = undefined;
    this.detalleSeleccionado = [];
    this.detalleError = '';

    if (!this.proveedorSeleccionado) {
      this.cotizaciones = [];
      this.cdr.markForCheck();
      return;
    }

    this.cargarCotizaciones(this.proveedorSeleccionado);
  }

  onVerDetalle(cotizacion: CotizacionResumen): void {
    if (!cotizacion) {
      return;
    }

    this.cotizacionSeleccionada = cotizacion;
    this.detalleLoading = true;
    this.detalleError = '';
    this.detalleSeleccionado = [];
    this.cdr.markForCheck();

    this.cotizacionesService
      .obtenerDetalleCotizacion(String(cotizacion.Id))
      .pipe(
        finalize(() => {
          this.detalleLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.detalleSeleccionado = items;
        },
        error: (error: Error) => {
          this.detalleError = error.message;
        },
      });
  }

  onExportarPdf(): void {
    if (!this.cotizacionSeleccionada || !this.detalleSeleccionado.length) {
      return;
    }

    const context = this.buildPdfContext(this.cotizacionSeleccionada);

    const columns: PdfTableColumn<DetalleCotizacionItem>[] = [
      { header: 'Codigo', width: 28, value: (row) => String(row?.Codigo || '-') },
      { header: 'Descripcion', width: 78, value: (row) => String(row?.Descripcion || '-') },
      { header: 'Cant.', width: 20, align: 'right', value: (row) => this.formatNumber(row?.Cantidad) },
      { header: 'Costo', width: 28, align: 'right', value: (row) => this.formatCurrency(row?.Costo) },
      { header: 'Total', width: 32, align: 'right', value: (row) => this.formatCurrency(row?.Total) },
    ];

    exportMasterDetailPdf({
      fileName: `cotizacion-${context.folio}.pdf`,
      title: 'COTIZACION DE COMPRA',
      folio: context.folio,
      store: context.tienda,
      user: context.generadoPor,
      generatedAt: context.fechaGeneracion,
      masterTitle: 'Datos generales',
      detailTitle: 'Detalle',
      logoPlaceholderText: 'LOGO',
      footerNote: 'Documento generado automaticamente desde el modulo de compras.',
      masterFieldsLeft: [
        { label: 'Proveedor', value: context.proveedor },
        { label: 'Comprador', value: context.comprador },
        { label: 'Estatus', value: context.estatus },
      ],
      masterFieldsRight: [
        { label: 'Fecha cotizacion', value: context.fecha },
        { label: 'Fecha estimada', value: context.fechaEstimada },
        { label: 'Folio visible', value: context.folio },
      ],
      columns,
      rows: this.detalleSeleccionado,
      totalLabel: 'TOTAL',
      totalValue: this.formatCurrency(this.totalDetalleSeleccionado),
    });
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
        },
        error: (error: Error) => {
          this.proveedoresError = error.message;
        },
      });
  }

  private cargarCotizaciones(proveedorId: string): void {
    this.cotizacionesLoading = true;
    this.cotizacionesError = '';
    this.cotizaciones = [];
    this.cotizacionesService
      .obtenerCotizaciones(proveedorId)
      .pipe(
        finalize(() => {
          this.cotizacionesLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (items) => {
          this.cotizaciones = items;
        },
        error: (error: Error) => {
          this.cotizacionesError = error.message;
        },
      });
  }

  private mapProveedores(items: ProveedorDto[]): ProveedorOption[] {
    return (items || []).map((item) => ({
      value: String(item.Id),
      label: item.nombre,
    }));
  }

  private buildPdfContext(cotizacion: CotizacionResumen): CotizacionPdfContext {
    const authUser = this.getAuthUserData();
    const tiendaNombre = this.pickString(authUser, ['NombreSucursal', 'Sucursal', 'sucursal', 'StoreName'])
      || `Sucursal ${cotizacion?.IdSucursal ?? 'N/D'}`;
    const tiendaId = this.pickString(authUser, ['IdSucursal', 'idSucursal'])
      || String(cotizacion?.IdSucursal ?? 'N/D');
    const usuario = cotizacion?.Comprador
      || this.pickString(authUser, ['Nombre', 'Usuario', 'UserName', 'username'])
      || 'N/D';

    return {
      folio: String(cotizacion?.Id ?? 'N/D'),
      proveedor: cotizacion?.Proveedor || 'N/D',
      comprador: cotizacion?.Comprador || 'N/D',
      fecha: cotizacion?.Fecha || 'N/D',
      fechaEstimada: cotizacion?.FechaEstimada || 'N/D',
      estatus: cotizacion?.NombreEstatus || 'N/D',
      tienda: `${tiendaNombre} (ID ${tiendaId})`,
      generadoPor: usuario,
      fechaGeneracion: new Date().toLocaleString('es-MX'),
    };
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
}
