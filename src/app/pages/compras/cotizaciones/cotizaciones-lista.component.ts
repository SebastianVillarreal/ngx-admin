import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
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

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const context = this.buildPdfContext(this.cotizacionSeleccionada);

    let y = this.drawPdfHeader(doc, context);
    y = this.drawPdfMasterData(doc, y, context);
    y = this.drawPdfDetailTable(doc, y + 4, this.detalleSeleccionado);

    if (y + 10 > 287) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text('Documento generado automaticamente desde el modulo de compras.', 12, y + 8);

    doc.save(`cotizacion-${context.folio}.pdf`);
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

  private drawPdfHeader(doc: jsPDF, context: CotizacionPdfContext): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const containerX = 12;
    const containerY = 10;
    const containerWidth = pageWidth - 24;
    const containerHeight = 30;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.rect(containerX, containerY, containerWidth, containerHeight);

    // Placeholder de logo para reemplazo posterior.
    doc.setDrawColor(160, 160, 160);
    doc.rect(containerX + 2, containerY + 2, 30, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('LOGO', containerX + 17, containerY + 16, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('COTIZACION DE COMPRA', containerX + 36, containerY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Folio: ${context.folio}`, containerX + 36, containerY + 16);
    doc.text(`Tienda: ${context.tienda}`, containerX + 36, containerY + 22);
    doc.text(`Usuario: ${context.generadoPor}`, containerX + 36, containerY + 28);

    doc.setFontSize(8);
    doc.text(`Generado: ${context.fechaGeneracion}`, containerX + containerWidth - 2, containerY + 28, { align: 'right' });

    return containerY + containerHeight + 8;
  }

  private drawPdfMasterData(doc: jsPDF, startY: number, context: CotizacionPdfContext): number {
    const boxX = 12;
    const boxY = startY;
    const boxWidth = 186;
    const boxHeight = 34;
    const leftX = boxX + 4;
    const rightX = boxX + 96;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.rect(boxX, boxY, boxWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Datos generales', boxX + 4, boxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Proveedor: ${context.proveedor}`, leftX, boxY + 13);
    doc.text(`Comprador: ${context.comprador}`, leftX, boxY + 19);
    doc.text(`Estatus: ${context.estatus}`, leftX, boxY + 25);

    doc.text(`Fecha cotizacion: ${context.fecha}`, rightX, boxY + 13);
    doc.text(`Fecha estimada: ${context.fechaEstimada}`, rightX, boxY + 19);
    doc.text(`Folio visible: ${context.folio}`, rightX, boxY + 25);

    return boxY + boxHeight + 2;
  }

  private drawPdfDetailTable(doc: jsPDF, startY: number, detalle: DetalleCotizacionItem[]): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 12;
    const tableX = 12;
    const tableWidth = 186;
    const colWidths = [28, 78, 20, 28, 32];
    const rowMinHeight = 6;
    let y = startY;

    const drawTableHeader = (): void => {
      doc.setFillColor(240, 240, 240);
      doc.rect(tableX, y, tableWidth, 7, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.rect(tableX, y, tableWidth, 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Codigo', tableX + 2, y + 4.5);
      doc.text('Descripcion', tableX + colWidths[0] + 2, y + 4.5);
      doc.text('Cant.', tableX + colWidths[0] + colWidths[1] + colWidths[2] - 2, y + 4.5, { align: 'right' });
      doc.text('Costo', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2, y + 4.5, { align: 'right' });
      doc.text('Total', tableX + tableWidth - 2, y + 4.5, { align: 'right' });
      y += 7;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Detalle', tableX, y - 1);
    drawTableHeader();

    for (const item of detalle) {
      const descripcion = String(item?.Descripcion || '-');
      const descripcionLines = doc.splitTextToSize(descripcion, colWidths[1] - 4);
      const rowHeight = Math.max(rowMinHeight, descripcionLines.length * 4 + 2);

      if (y + rowHeight > pageHeight - marginBottom) {
        doc.addPage();
        y = 16;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Detalle (continuacion)', tableX, y - 1);
        drawTableHeader();
      }

      doc.setDrawColor(210, 210, 210);
      doc.rect(tableX, y, tableWidth, rowHeight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(String(item?.Codigo || '-'), tableX + 2, y + 4.2);
      doc.text(descripcionLines, tableX + colWidths[0] + 2, y + 4.2);
      doc.text(this.formatNumber(item?.Cantidad), tableX + colWidths[0] + colWidths[1] + colWidths[2] - 2, y + 4.2, { align: 'right' });
      doc.text(this.formatCurrency(item?.Costo), tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2, y + 4.2, { align: 'right' });
      doc.text(this.formatCurrency(item?.Total), tableX + tableWidth - 2, y + 4.2, { align: 'right' });

      y += rowHeight;
    }

    if (y + 8 > pageHeight - marginBottom) {
      doc.addPage();
      y = 16;
    }

    doc.setDrawColor(180, 180, 180);
    doc.rect(tableX, y, tableWidth, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('TOTAL', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2, y + 5.2, { align: 'right' });
    doc.text(this.formatCurrency(this.totalDetalleSeleccionado), tableX + tableWidth - 2, y + 5.2, { align: 'right' });

    return y + 8;
  }

  private buildPdfContext(cotizacion: CotizacionResumen): CotizacionPdfContext {
    const authUser = this.getAuthUserData();
    const tiendaNombre = this.pickString(authUser, ['NombreSucursal', 'Sucursal', 'sucursal', 'StoreName']) || `Sucursal ${cotizacion?.IdSucursal ?? 'N/D'}`;
    const tiendaId = this.pickString(authUser, ['IdSucursal', 'idSucursal']) || String(cotizacion?.IdSucursal ?? 'N/D');
    const usuario = cotizacion?.Comprador || this.pickString(authUser, ['Nombre', 'Usuario', 'UserName', 'username']) || 'N/D';

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
