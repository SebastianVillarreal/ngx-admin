import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { ClientesService } from '../../clientes/clientes.service';
import { CreditosService, EstadoCuentaItem } from '../../creditos/creditos.service';

interface ClienteOption {
  value: string;
  label: string;
}

interface EstadoCuentaView extends EstadoCuentaItem {
  FechaDate: Date | null;
  FechaVencimientoDate: Date | null;
}

type SortColumn = 'FolioInterno' | 'Cliente' | 'Fecha' | 'FechaVencimiento' | 'Total' | 'Abonado' | 'Resto';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'ngx-estado-cuenta',
  templateUrl: './estado-cuenta.component.html',
  styleUrls: ['./estado-cuenta.component.scss'],
})
export class EstadoCuentaComponent implements OnInit {
  clientes: ClienteOption[] = [];
  selectedCliente = '';
  selectedFecha = this.getTodayIsoDate();
  clientesLoading = false;
  clientesError = '';

  items: EstadoCuentaView[] = [];
  displayItems: EstadoCuentaView[] = [];
  paginatedItems: EstadoCuentaView[] = [];

  loading = false;
  error = '';
  searchTerm = '';

  sortColumn: SortColumn = 'Fecha';
  sortDirection: SortDirection = 'desc';

  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  constructor(
    private readonly clientesService: ClientesService,
    private readonly creditosService: CreditosService,
  ) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.clientesLoading = true;
    this.clientesError = '';
    this.clientesService.fetchClientes('').subscribe({
      next: (clientes) => {
        this.clientes = (clientes || []).map((cliente) => ({
          value: String(cliente.Id ?? cliente.IdCliente ?? ''),
          label: cliente.Nombre || `Cliente #${cliente.Id}`,
        }));
        this.clientesLoading = false;
      },
      error: (err) => {
        this.clientesLoading = false;
        this.clientesError = err?.message || 'No se pudo cargar el catalogo de clientes.';
      },
    });
  }

  buscarEstadoCuenta(): void {
    this.error = '';
    if (!this.selectedCliente) {
      this.error = 'Selecciona un cliente para continuar.';
      return;
    }
    if (!this.selectedFecha) {
      this.error = 'Selecciona una fecha para continuar.';
      return;
    }

    this.loading = true;
    this.items = [];
    this.displayItems = [];
    this.paginatedItems = [];
    this.currentPage = 1;

    this.creditosService.fetchEstadoCuentaCliente(this.selectedCliente, this.selectedFecha).subscribe({
      next: (records) => {
        this.items = (records || []).map((item) => ({
          ...item,
          FechaDate: this.parseSlashDate(item.Fecha),
          FechaVencimientoDate: this.parseSlashDate(item.FechaVencimiento),
        }));
        this.applyTransforms();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo recuperar el estado de cuenta.';
      },
    });
  }

  retryLoad(): void {
    if (this.error && this.selectedCliente && this.selectedFecha) {
      this.buscarEstadoCuenta();
      return;
    }
    this.loadClientes();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyTransforms();
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.applyTransforms();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 1;
    this.paginate();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }
    this.currentPage -= 1;
    this.paginate();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }
    this.currentPage += 1;
    this.paginate();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayItems.length / this.pageSize));
  }

  get pageStart(): number {
    if (!this.displayItems.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (!this.displayItems.length) {
      return 0;
    }
    return Math.min(this.currentPage * this.pageSize, this.displayItems.length);
  }

  get totalGeneral(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.Total) || 0), 0);
  }

  get abonadoGeneral(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.Abonado) || 0), 0);
  }

  get restoGeneral(): number {
    return this.displayItems.reduce((acc, item) => acc + (Number(item.Resto) || 0), 0);
  }

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item) => ({
      FolioInterno: item.FolioInterno,
      Cliente: item.Cliente,
      Fecha: item.FechaDate ? item.FechaDate.toLocaleDateString('es-MX') : item.Fecha,
      FechaVencimiento: item.FechaVencimientoDate
        ? item.FechaVencimientoDate.toLocaleDateString('es-MX')
        : item.FechaVencimiento,
      Total: item.Total,
      Abonado: item.Abonado,
      Resto: item.Resto,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EstadoCuenta');
    XLSX.writeFile(workbook, 'estado-cuenta.xlsx');
  }

  exportToPdf(): void {
    if (!this.displayItems.length) {
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const marginX = 14;
    const pageWidth = 210;
    const contentWidth = pageWidth - marginX * 2;
    const pageBottom = 287;
    const rowHeight = 6;
    const colWidths = [28, 46, 20, 20, 22, 22, 24];
    const headers = ['Folio', 'Cliente', 'Fecha', 'Vence', 'Total', 'Abonado', 'Resto'];

    let y = this.drawPdfHeader(doc, marginX, contentWidth);
    y = this.drawPdfTableHeader(doc, marginX, y, headers, colWidths);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    this.displayItems.forEach((item) => {
      if (y + rowHeight > pageBottom) {
        doc.addPage();
        y = this.drawPdfHeader(doc, marginX, contentWidth);
        y = this.drawPdfTableHeader(doc, marginX, y, headers, colWidths);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
      }

      const row = [
        this.truncateText(item.FolioInterno || '', 18),
        this.truncateText(item.Cliente || '', 32),
        item.FechaDate ? item.FechaDate.toLocaleDateString('es-MX') : (item.Fecha || ''),
        item.FechaVencimientoDate ? item.FechaVencimientoDate.toLocaleDateString('es-MX') : (item.FechaVencimiento || ''),
        this.formatCurrency(item.Total),
        this.formatCurrency(item.Abonado),
        this.formatCurrency(item.Resto),
      ];

      let x = marginX;
      row.forEach((cell, index) => {
        const cellWidth = colWidths[index];
        const align = index >= 4 ? 'right' : 'left';
        doc.text(String(cell), align === 'right' ? x + cellWidth - 1 : x + 1, y + 4.2, { align });
        x += cellWidth;
      });
      y += rowHeight;
    });

    const totals = this.getTotalsFromList(this.displayItems);
    if (y + 10 > pageBottom) {
      doc.addPage();
      y = this.drawPdfHeader(doc, marginX, contentWidth);
      y = this.drawPdfTableHeader(doc, marginX, y, headers, colWidths);
    }
    doc.setDrawColor(140);
    doc.line(marginX, y + 1, marginX + colWidths.reduce((acc, val) => acc + val, 0), y + 1);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTALES', marginX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2, y, { align: 'right' });
    doc.text(this.formatCurrency(totals.total), marginX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] - 1, y, { align: 'right' });
    doc.text(this.formatCurrency(totals.abonado), marginX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] - 1, y, { align: 'right' });
    doc.text(this.formatCurrency(totals.resto), marginX + colWidths.reduce((acc, val) => acc + val, 0) - 1, y, { align: 'right' });

    doc.setFontSize(8);
    doc.text(
      `Registros: ${this.displayItems.length} | Fecha corte: ${this.selectedFecha}`,
      marginX,
      pageBottom + 6 > 297 ? 292 : pageBottom + 6,
    );

    const suffix = this.selectedFecha || this.getTodayIsoDate();
    doc.save(`estado-cuenta-${suffix}.pdf`);
  }

  trackByItem(_: number, item: EstadoCuentaView): number {
    return item.IdTicketCredito || item.Id;
  }

  get clienteSeleccionadoNombre(): string {
    if (!this.selectedCliente) {
      return '';
    }
    return this.clientes.find((item) => item.value === this.selectedCliente)?.label ?? '';
  }

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) => this.matchesSearch(item, term))
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareValues(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private matchesSearch(item: EstadoCuentaView, term: string): boolean {
    return (item.FolioInterno || '').toLowerCase().includes(term)
      || (item.Cliente || '').toLowerCase().includes(term)
      || String(item.Total ?? '').toLowerCase().includes(term)
      || String(item.Abonado ?? '').toLowerCase().includes(term)
      || String(item.Resto ?? '').toLowerCase().includes(term);
  }

  private compareValues(a: EstadoCuentaView, b: EstadoCuentaView): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;

    switch (this.sortColumn) {
      case 'Fecha':
        result = this.compareDate(a.FechaDate, b.FechaDate);
        break;
      case 'FechaVencimiento':
        result = this.compareDate(a.FechaVencimientoDate, b.FechaVencimientoDate);
        break;
      case 'Total':
        result = (Number(a.Total) || 0) - (Number(b.Total) || 0);
        break;
      case 'Abonado':
        result = (Number(a.Abonado) || 0) - (Number(b.Abonado) || 0);
        break;
      case 'Resto':
        result = (Number(a.Resto) || 0) - (Number(b.Resto) || 0);
        break;
      case 'Cliente':
      case 'FolioInterno':
      default:
        result = String(a[this.sortColumn] || '').localeCompare(String(b[this.sortColumn] || ''), 'es', {
          sensitivity: 'base',
        });
        break;
    }

    return result * factor;
  }

  private compareDate(a: Date | null, b: Date | null): number {
    const aTime = a ? a.getTime() : 0;
    const bTime = b ? b.getTime() : 0;
    return aTime - bTime;
  }

  private parseSlashDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const parts = value.split('/');
    if (parts.length !== 3) {
      return null;
    }
    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!day || !month || !year) {
      return null;
    }
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getTodayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private drawPdfHeader(doc: jsPDF, marginX: number, contentWidth: number): number {
    const headerTop = 12;
    const headerHeight = 32;

    doc.setDrawColor(120);
    doc.rect(marginX, headerTop, contentWidth, headerHeight);

    doc.rect(marginX + 2, headerTop + 2, 30, headerHeight - 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('LOGO', marginX + 17, headerTop + 18, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('TIENDA: ________________________________', marginX + 36, headerTop + 9);
    doc.text('DIRECCION: _____________________________', marginX + 36, headerTop + 16);
    doc.text('TELEFONO: ______________________________', marginX + 36, headerTop + 23);
    doc.text('RFC: ___________________________________', marginX + 36, headerTop + 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Estado de Cuenta', marginX, headerTop + headerHeight + 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const cliente = this.clienteSeleccionadoNombre || `Cliente ${this.selectedCliente}`;
    doc.text(`Cliente: ${cliente}`, marginX, headerTop + headerHeight + 14);
    doc.text(`Fecha corte: ${this.selectedFecha}`, marginX + 110, headerTop + headerHeight + 14);

    return headerTop + headerHeight + 20;
  }

  private drawPdfTableHeader(
    doc: jsPDF,
    marginX: number,
    y: number,
    headers: string[],
    colWidths: number[],
  ): number {
    const headerHeight = 6;
    doc.setFillColor(235, 235, 235);
    doc.rect(marginX, y - 1, colWidths.reduce((acc, val) => acc + val, 0), headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    let x = marginX;
    headers.forEach((label, index) => {
      const align = index >= 4 ? 'right' : 'left';
      const width = colWidths[index];
      doc.text(label, align === 'right' ? x + width - 1 : x + 1, y + 3, { align });
      x += width;
    });

    return y + headerHeight;
  }

  private formatCurrency(value: number | null | undefined): string {
    const safe = Number(value) || 0;
    return safe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private getTotalsFromList(list: EstadoCuentaView[]): { total: number; abonado: number; resto: number } {
    return list.reduce(
      (acc, item) => ({
        total: acc.total + (Number(item.Total) || 0),
        abonado: acc.abonado + (Number(item.Abonado) || 0),
        resto: acc.resto + (Number(item.Resto) || 0),
      }),
      { total: 0, abonado: 0, resto: 0 },
    );
  }

  private truncateText(value: string, max: number): string {
    if (!value || value.length <= max) {
      return value;
    }
    return `${value.slice(0, Math.max(0, max - 3))}...`;
  }
}
