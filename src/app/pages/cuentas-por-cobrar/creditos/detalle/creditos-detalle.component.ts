import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';

import {
  CreditosService,
  CreditoCliente,
  CreditoOperacion,
  AbonoTicket,
  InsertDetalleFolioAbonoPayload,
  DetalleFolioAbono,
} from '../creditos.service';
import { ClientesService, Cliente } from '../../clientes/clientes.service';
import { NbDialogRef, NbDialogService } from '@nebular/theme';

interface CreditoFolioDetalle {
  folioInterno: string;
  total: number;
  abonado: number;
  restante: number;
  fecha: Date | null;
  fechaVencimiento: Date | null;
}

@Component({
  selector: 'ngx-creditos-detalle',
  templateUrl: './creditos-detalle.component.html',
  styleUrls: ['./creditos-detalle.component.scss'],
})
export class CreditosDetalleComponent implements OnInit {
  detalleForm: FormGroup;
  clienteId: number | null = null;
  resumenCredito: CreditoCliente | null = null;
  loadingDetalle = false;
  detalleError = '';
  folios: CreditoFolioDetalle[] = [];
  operaciones: CreditoOperacion[] = [];
  readonly abonosPageOptions = [5, 10, 20, 50];
  abonosPorPagina = 10;
  formaPagoOptions = [
    { value: '1', label: 'Efectivo' },
    { value: '2', label: 'Tarjeta' },
    { value: '3', label: 'Cheque' },
  ];
  abonosDialogRef?: NbDialogRef<unknown>;
  abonosTicket: AbonoTicket[] = [];
  abonosLoading = false;
  abonosError = '';
  abonosFolio = '';
  folioLoading = false;
  folioSuccess = '';
  folioError = '';
  readonly defaultSucursal = '1';
  readonly defaultUsuario = '1';
  abonoInputs: Record<string, string> = {};
  abonoLoadingMap: Record<string, boolean> = {};
  abonoErrorMap: Record<string, string> = {};
  abonoSuccessMap: Record<string, string> = {};
  abonoAutoCheck: Record<string, boolean> = {};
  detalleAbonos: DetalleFolioAbono[] = [];
  detalleAbonosLoading = false;
  detalleAbonosError = '';
  finalizarDialogRef?: NbDialogRef<unknown>;
  totalFinalizarAbono = 0;
  montoFinalizar = '';
  cambioFinalizar = 0;
  finalizarPuedeCerrar = false;
  finalizarDialogError = '';
  finalizarLoading = false;

  @ViewChild('abonosDialog', { static: true }) abonosDialog!: TemplateRef<unknown>;
  @ViewChild('finalizarDialog', { static: true }) finalizarDialog!: TemplateRef<unknown>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly creditosService: CreditosService,
    private readonly clientesService: ClientesService,
    private readonly dialogService: NbDialogService,
  ) {
    this.detalleForm = this.fb.group({
      nombre: [{ value: '', disabled: true }],
      limiteCredito: [{ value: '', disabled: true }],
      deudaActual: [{ value: '', disabled: true }],
      creditoDisponible: [{ value: '', disabled: true }],
      formaPago: [''],
      referencia: [''],
      folioOp: ['0'],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.clienteId = idParam ? Number(idParam) : null;
    if (!this.clienteId) {
      this.detalleError = 'Identificador de cliente inválido.';
      return;
    }

    this.loadDetalle(this.clienteId);
  }

  get totalRestante(): number {
    return this.folios.reduce((acc, folio) => acc + folio.restante, 0);
  }

  get totalRestantePagina(): number {
    return this.totalRestante;
  }

  get totalDetalleAbonos(): number {
    return this.detalleAbonos.reduce((acc, abono) => acc + (Number(abono?.Abono) || 0), 0);
  }

  exportFolios(): void {
    // TODO: integrar exportación específica cuando el servicio esté disponible.
    console.log('Exportar folios', this.folios);
  }

  crearFolio(): void {
    this.folioSuccess = '';
    this.folioError = '';
    if (!this.clienteId) {
      this.folioError = 'No se encontró el identificador del cliente.';
      return;
    }

    const formaPago = this.detalleForm.get('formaPago')?.value;
    const referencia = (this.detalleForm.get('referencia')?.value ?? '').trim();

    if (!formaPago) {
      this.folioError = 'Selecciona una forma de pago para continuar.';
      return;
    }

    const payload = {
      IdCliente: String(this.clienteId),
      IdSucursal: this.resolveSucursal(),
      Usuario: this.defaultUsuario,
      FormaPago: String(formaPago),
      Referencia: referencia || 'SIN REFERENCIA',
    };

    this.folioLoading = true;
    this.creditosService.insertFolioAbono(payload).subscribe({
      next: (folioOp) => {
        this.folioLoading = false;
        if (!folioOp) {
          this.folioError = 'El servicio no devolvió un folio válido.';
          return;
        }
        this.detalleForm.patchValue({ folioOp: folioOp.toString() });
        this.folioSuccess = `Folio creado exitosamente (OP: ${folioOp}).`;
        this.loadDetalleAbonos(folioOp.toString());
      },
      error: (err) => {
        this.folioLoading = false;
        this.folioError = err?.message || 'No se pudo crear el folio de abono.';
      },
    });
  }

  finalizarCredito(): void {
    const folioOp = this.detalleForm.get('folioOp')?.value;
    if (!folioOp || folioOp === '0') {
      this.folioError = 'Primero genera el Folio OP para poder finalizar.';
      return;
    }

    if (!this.detalleAbonos.length) {
      this.folioError = 'Registra al menos un abono antes de finalizar.';
      return;
    }

    this.totalFinalizarAbono = this.totalDetalleAbonos;
    if (this.totalFinalizarAbono <= 0) {
      this.folioError = 'No hay monto abonado para finalizar.';
      return;
    }

    this.montoFinalizar = '';
    this.cambioFinalizar = 0;
    this.finalizarPuedeCerrar = false;
    this.finalizarDialogError = '';
    this.finalizarDialogRef = this.dialogService.open(this.finalizarDialog, {
      autoFocus: false,
      closeOnBackdropClick: false,
    });
  }

  cancelarOperacion(): void {
    console.log('Cancelar operación de crédito');
  }

  verHistorico(): void {
    console.log('Ver histórico de crédito');
  }

  private loadDetalle(idCliente: number): void {
    this.loadingDetalle = true;
    this.detalleError = '';
    forkJoin({
      resumenes: this.creditosService.fetchCreditos(),
      cliente: this.clientesService.fetchClienteById(idCliente),
      operaciones: this.creditosService.fetchTicketCreditos(idCliente),
    }).subscribe({
      next: ({ resumenes, cliente, operaciones }) => {
        this.resumenCredito = resumenes.find((item) => item.Id === idCliente) ?? null;
        this.patchClienteToForm(cliente, this.resumenCredito);
        this.operaciones = operaciones ?? [];
        this.folios = this.buildFoliosFromOperaciones(this.operaciones);
        const currentFolio = this.detalleForm.get('folioOp')?.value;
        if (currentFolio && currentFolio !== '0') {
          this.loadDetalleAbonos(currentFolio);
        } else {
          this.detalleAbonos = [];
        }
        this.loadingDetalle = false;
      },
      error: (err) => {
        this.detalleError = err?.message || 'No se pudo obtener el detalle del crédito.';
        this.loadingDetalle = false;
      },
    });
  }

  private patchClienteToForm(cliente: Cliente | null, resumen: CreditoCliente | null): void {
    this.detalleForm.patchValue({
      nombre: cliente?.Nombre || resumen?.Nombre || '',
      limiteCredito: this.formatCurrency(resumen?.LimiteCreditoCliente ?? cliente?.LimiteCredito ?? 0),
      deudaActual: this.formatCurrency(resumen?.Deuda ?? 0),
      creditoDisponible: this.formatCurrency(this.computeCreditoDisponible(resumen)),
      formaPago: '',
      referencia: '',
      folioOp: '0',
    });
  }

  private computeCreditoDisponible(resumen: CreditoCliente | null): number {
    if (!resumen) {
      return 0;
    }
    const base = resumen.LimiteCreditoCliente || resumen.CreditoOriginal || 0;
    return base - (resumen.Deuda || 0);
  }

  private buildFoliosFromOperaciones(operaciones: CreditoOperacion[]): CreditoFolioDetalle[] {
    if (!operaciones?.length) {
      return [];
    }

    return operaciones.map((operacion) => ({
      folioInterno: operacion.FolioInterno || operacion.Folio || `TCK-${operacion.IdTicketCredito}`,
      total: operacion.Total,
      abonado: operacion.Abonado,
      restante: operacion.Resto,
      fecha: this.parseSlashDate(operacion.Fecha),
      fechaVencimiento: this.parseSlashDate(operacion.FechaVencimiento),
    }));
  }

  openAbonosDialog(folio: CreditoFolioDetalle): void {
    if (!folio?.folioInterno) {
      return;
    }

    this.abonosFolio = folio.folioInterno;
    this.abonosTicket = [];
    this.abonosError = '';
    this.abonosLoading = true;
    this.abonosDialogRef = this.dialogService.open(this.abonosDialog, {
      context: {},
      autoFocus: false,
      closeOnBackdropClick: true,
    });

    this.loadAbonosTicket(folio.folioInterno);
  }

  closeAbonosDialog(): void {
    this.abonosDialogRef?.close();
  }

  handleAutoAbonoToggle(folio: CreditoFolioDetalle, checked: boolean): void {
    if (!folio?.folioInterno) {
      return;
    }

    this.abonoAutoCheck[folio.folioInterno] = checked;
    if (checked) {
      this.autoAbonarRestante(folio);
    }
  }

  private autoAbonarRestante(folio: CreditoFolioDetalle): void {
    const folioInterno = folio.folioInterno;
    const restante = folio.restante ?? 0;

    if (this.abonoLoadingMap[folioInterno]) {
      this.clearAutoCheck(folioInterno);
      return;
    }

    if (restante <= 0) {
      this.abonoErrorMap[folioInterno] = 'Este folio ya no tiene saldo pendiente.';
      this.clearAutoCheck(folioInterno);
      return;
    }

    this.abonoInputs[folioInterno] = restante.toString();
    this.submitAbono(folio, restante);
    this.clearAutoCheck(folioInterno);
  }

  private clearAutoCheck(folioInterno: string): void {
    this.abonoAutoCheck[folioInterno] = false;
  }

  submitAbono(folio: CreditoFolioDetalle, overrideMonto?: number): void {
    if (!folio?.folioInterno) {
      return;
    }

    const folioInterno = folio.folioInterno;
    const hasOverride = overrideMonto !== undefined;
    const rawValue = hasOverride ? String(overrideMonto) : `${this.abonoInputs[folioInterno] ?? ''}`.trim();
    const folioOp = this.detalleForm.get('folioOp')?.value;
    this.abonoErrorMap[folioInterno] = '';
    this.abonoSuccessMap[folioInterno] = '';

    if (!folioOp || folioOp === '0') {
      this.abonoErrorMap[folioInterno] = 'Primero genera el Folio OP.';
      return;
    }

    if (!rawValue) {
      this.abonoErrorMap[folioInterno] = 'Ingresa un monto válido.';
      return;
    }

    const monto = hasOverride ? Number(overrideMonto) : Number(rawValue);
    if (Number.isNaN(monto) || monto <= 0) {
      this.abonoErrorMap[folioInterno] = 'El monto debe ser mayor a cero.';
      return;
    }

    const restante = folio.restante ?? 0;
    if (monto > restante) {
      this.abonoErrorMap[folioInterno] = `El máximo permitido es ${restante.toFixed(2)}.`;
      return;
    }

    const payload: InsertDetalleFolioAbonoPayload = {
      IdFolio: folioOp.toString(),
      FolioInterno: folioInterno,
      Monto: monto.toString(),
    };

    this.abonoLoadingMap[folioInterno] = true;
    this.creditosService.insertDetalleFolioAbono(payload).subscribe({
      next: () => {
        this.abonoLoadingMap[folioInterno] = false;
        this.abonoInputs[folioInterno] = '';
        this.abonoSuccessMap[folioInterno] = 'Abono registrado.';
        this.updateFolioTotals(folio, monto);
        if (this.abonosDialogRef && this.abonosFolio === folioInterno) {
          this.loadAbonosTicket(folioInterno, false);
        }
        this.loadDetalleAbonos(folioOp.toString());
      },
      error: (err) => {
        this.abonoLoadingMap[folioInterno] = false;
        this.abonoErrorMap[folioInterno] = err?.message || 'No se pudo registrar el abono.';
      },
    });
  }

  onMontoFinalizarChange(value: string): void {
    this.montoFinalizar = value;
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric <= 0) {
      this.cambioFinalizar = 0;
      this.finalizarPuedeCerrar = false;
      return;
    }

    this.cambioFinalizar = Math.max(Number((numeric - this.totalFinalizarAbono).toFixed(2)), 0);
    this.finalizarPuedeCerrar = numeric >= this.totalFinalizarAbono;
  }

  confirmarFinalizarAbono(): void {
    if (!this.finalizarPuedeCerrar || this.finalizarLoading) {
      return;
    }

    const folioOp = this.detalleForm.get('folioOp')?.value;
    if (!folioOp || folioOp === '0') {
      this.finalizarDialogError = 'Folio OP inválido.';
      return;
    }

    this.finalizarDialogError = '';
    this.finalizarLoading = true;
    const folioRef = folioOp.toString();
    this.creditosService.finalizarFolioAbono(folioRef).subscribe({
      next: (result) => {
        this.finalizarLoading = false;
        if (!result?.success) {
          this.finalizarDialogError = 'El servicio no pudo finalizar el folio.';
          return;
        }
        this.finalizarDialogRef?.close();
        if (result.pdfBase64) {
          this.downloadPdfFromBase64(result.pdfBase64, `Comprobante-Folio-${folioRef}.pdf`);
        } else {
          this.generateLocalComprobantePdf(folioRef);
        }
        this.folioSuccess = 'Abono finalizado correctamente.';
        this.montoFinalizar = '';
        this.cambioFinalizar = 0;
        this.finalizarPuedeCerrar = false;
        this.loadDetalleAbonos(folioRef);
        if (this.clienteId) {
          this.loadDetalle(this.clienteId);
        }
      },
      error: (err) => {
        this.finalizarLoading = false;
        this.finalizarDialogError = err?.message || 'No se pudo finalizar el folio de abono.';
      },
    });
  }

  closeFinalizarDialog(): void {
    this.finalizarDialogRef?.close();
  }

  private downloadPdfFromBase64(base64Data: string, fileName: string): void {
    if (!base64Data) {
      return;
    }
    const normalized = base64Data.includes(',') ? base64Data.split(',').pop() || '' : base64Data;
    if (!normalized) {
      return;
    }
    const blob = this.base64ToBlob(normalized, 'application/pdf');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  private generateLocalComprobantePdf(folioOp: string): void {
    const doc = new jsPDF();
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(now);
    const clienteNombre = this.detalleForm.get('nombre')?.value || this.resumenCredito?.Nombre || 'Cliente sin nombre';
    const totalAbonado = this.formatCurrencyWithSymbol(this.totalDetalleAbonos);

    doc.setFontSize(16);
    doc.text('Comprobante de Abono', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Folio OP: ${folioOp}`, 15, 32);
    doc.text(`Cliente: ${clienteNombre}`, 15, 40);
    doc.text(`Fecha: ${formattedDate}`, 15, 48);
    doc.text(`Total abonado: ${totalAbonado}`, 15, 56);
    doc.line(15, 60, 195, 60);

    let posY = 70;
    doc.setFontSize(12);
    doc.text('Detalle de abonos', 15, posY);
    posY += 8;
    doc.setFontSize(10);

    const headers = ['ID', 'Folio', 'Monto', 'Restante', 'Fecha'];
    doc.text(headers.join('        '), 15, posY);
    posY += 6;

    if (!this.detalleAbonos.length) {
      doc.text('No se registraron abonos para este folio.', 15, posY);
    } else {
      const pageHeight = doc.internal.pageSize.getHeight();
      const bottomMargin = 20;
      this.detalleAbonos.forEach((abono, index) => {
        if (posY > pageHeight - bottomMargin) {
          doc.addPage();
          posY = 20;
          doc.text(headers.join('        '), 15, posY);
          posY += 6;
        }
        const row = [
          String(abono.Id),
          abono.FolioInterno,
          this.formatCurrencyWithSymbol(abono.Abono),
          this.formatCurrencyWithSymbol(abono.Restante),
          abono.Fecha || '---',
        ].join('        ');
        doc.text(row, 15, posY);
        posY += 6;
      });
    }

    posY = Math.min(posY + 10, doc.internal.pageSize.getHeight() - 30);
    doc.setFontSize(9);
    doc.text('Documento generado automáticamente desde el portal de créditos.', 15, posY);

    doc.save(`Comprobante-Folio-${folioOp}.pdf`);
  }

  private parseSlashDate(value: string | null): Date | null {
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
    return new Date(year, month - 1, day);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value || 0,
    );
  }

  private formatCurrencyWithSymbol(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  }

  private resolveSucursal(): string {
    const idSucursal = this.resumenCredito?.idSucursal ?? this.resumenCredito?.IdCliente ?? Number(this.defaultSucursal);
    return String(idSucursal || this.defaultSucursal);
  }

  private loadAbonosTicket(folioInterno: string, showSpinner = true): void {
    if (showSpinner) {
      this.abonosLoading = true;
    }
    this.creditosService.fetchAbonosTicket(folioInterno).subscribe({
      next: (abonos) => {
        this.abonosTicket = abonos;
        this.abonosLoading = false;
      },
      error: (err) => {
        this.abonosError = err?.message || 'No se pudo obtener la lista de abonos.';
        this.abonosLoading = false;
      },
    });
  }

  private updateFolioTotals(folio: CreditoFolioDetalle, monto: number): void {
    folio.abonado = Number((folio.abonado + monto).toFixed(2));
    folio.restante = Number(Math.max((folio.restante ?? 0) - monto, 0).toFixed(2));
  }

  private loadDetalleAbonos(idFolio: string): void {
    if (!idFolio || idFolio === '0') {
      this.detalleAbonos = [];
      return;
    }

    this.detalleAbonosLoading = true;
    this.detalleAbonosError = '';
    this.creditosService.fetchDetalleFolioAbonos(idFolio).subscribe({
      next: (items) => {
        this.detalleAbonos = items;
        this.detalleAbonosLoading = false;
      },
      error: (err) => {
        this.detalleAbonosLoading = false;
        this.detalleAbonosError = err?.message || 'No se pudo obtener el detalle de abonos.';
      },
    });
  }
}
