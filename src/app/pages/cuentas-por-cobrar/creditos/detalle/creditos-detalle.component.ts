import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CreditosService, CreditoCliente } from '../creditos.service';
import { ClientesService, Cliente } from '../../clientes/clientes.service';

interface CreditoFolioDetalle {
  folioInterno: string;
  total: number;
  abonado: number;
  restante: number;
  fecha: string;
  fechaVencimiento: string;
}

interface CreditoAbonoDetalle {
  folioInterno: string;
  total: number;
  abonado: number;
  restante: number;
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
  abonos: CreditoAbonoDetalle[] = [];
  readonly abonosPageOptions = [5, 10, 20, 50];
  abonosPorPagina = 10;
  formaPagoOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta', label: 'Tarjeta' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly creditosService: CreditosService,
    private readonly clientesService: ClientesService,
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

  exportFolios(): void {
    // TODO: integrar exportación específica cuando el servicio esté disponible.
    console.log('Exportar folios', this.folios);
  }

  crearFolio(): void {
    console.log('Crear folio para cliente', this.clienteId);
  }

  finalizarCredito(): void {
    console.log('Finalizar crédito', this.clienteId);
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
    }).subscribe({
      next: ({ resumenes, cliente }) => {
        this.resumenCredito = resumenes.find((item) => item.Id === idCliente) ?? null;
        this.patchClienteToForm(cliente, this.resumenCredito);
        this.buildMockFolios(this.resumenCredito);
        this.buildMockAbonos(this.folios);
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

  private buildMockFolios(resumen: CreditoCliente | null): void {
    if (!resumen) {
      this.folios = [];
      return;
    }

    const rows = Math.max(1, Math.min(resumen.Tickets || 1, 5));
    const totalDeuda = resumen.Deuda || 0;
    const base = rows ? totalDeuda / rows : totalDeuda;
    const now = new Date();

    this.folios = Array.from({ length: rows }, (_, index) => {
      const abonado = Number((base * (index === 0 ? 0.2 : 0)).toFixed(2));
      const restante = Number((base - abonado).toFixed(2));
      const fecha = new Date(now);
      fecha.setDate(now.getDate() - index * 5);
      const vencimiento = new Date(fecha);
      vencimiento.setDate(fecha.getDate() + 20);

      return {
        folioInterno: `${resumen.Id}${fecha.getFullYear()}${index + 1}`,
        total: Number(base.toFixed(2)),
        abonado,
        restante,
        fecha: fecha.toISOString().substring(0, 10),
        fechaVencimiento: vencimiento.toISOString().substring(0, 10),
      };
    });
  }

  private buildMockAbonos(folios: CreditoFolioDetalle[]): void {
    const abonos: CreditoAbonoDetalle[] = [];
    folios.forEach((folio) => {
      abonos.push({
        folioInterno: folio.folioInterno,
        total: folio.total,
        abonado: folio.abonado,
        restante: folio.restante,
      });
    });
    this.abonos = abonos;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value || 0,
    );
  }
}
