import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import {
  CotizacionesService,
  CotizacionResumen,
  DetalleCotizacionItem,
  ProveedorDto,
} from './cotizaciones.service';

interface ProveedorOption {
  value: string;
  label: string;
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
}
