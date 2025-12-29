import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';

import { CreditosService, HistoricoTicket } from '../creditos.service';
import { ClientesService } from '../../clientes/clientes.service';

interface ClienteOption {
  value: string;
  label: string;
}

interface HistoricoTicketView extends HistoricoTicket {
  FechaDate: Date | null;
  FechaPagoDate: Date | null;
}

@Component({
  selector: 'ngx-historico-creditos',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss'],
})
export class HistoricoComponent implements OnInit {
  clientes: ClienteOption[] = [];
  selectedCliente = '';
  clientesLoading = false;
  clientesError = '';
  historico: HistoricoTicketView[] = [];
  filteredHistorico: HistoricoTicketView[] = [];
  historicoLoading = false;
  historicoError = '';
  totalHistorico = 0;
  searchTerm = '';

  constructor(
    private readonly creditosService: CreditosService,
    private readonly clientesService: ClientesService,
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
          value: String(cliente.Id ?? cliente.IdCliente ?? cliente.idSucursal ?? ''),
          label: cliente.Nombre || `Cliente #${cliente.Id}`,
        }));
        this.clientesLoading = false;
      },
      error: (err) => {
        this.clientesLoading = false;
        this.clientesError = err?.message || 'No se pudo cargar el catálogo de clientes.';
      },
    });
  }

  buscarHistorico(): void {
    this.historicoError = '';
    if (!this.selectedCliente) {
      this.historicoError = 'Selecciona un cliente para continuar.';
      return;
    }

    this.historicoLoading = true;
    this.historico = [];
    this.filteredHistorico = [];
    this.totalHistorico = 0;

    this.creditosService.fetchHistoricoTC(this.selectedCliente).subscribe({
      next: (records) => {
        this.historico = (records || []).map((item) => ({
          ...item,
          FechaDate: this.parseSlashDate(item.Fecha),
          FechaPagoDate: this.parseSlashDate(item.FechaPago),
        }));
        this.applyFilters();
        this.historicoLoading = false;
      },
      error: (err) => {
        this.historicoLoading = false;
        this.historicoError = err?.message || 'No se pudo recuperar el histórico.';
      },
    });
  }

  get clienteSeleccionadoNombre(): string {
    if (!this.selectedCliente) {
      return '';
    }
    return this.clientes.find((item) => item.value === this.selectedCliente)?.label ?? '';
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  exportToExcel(): void {
    if (!this.filteredHistorico.length) {
      return;
    }

    const data = this.filteredHistorico.map((item) => ({
      Folio: item.FolioInterno,
      Cliente: item.Cliente,
      Fecha: item.FechaDate ? item.FechaDate.toLocaleDateString('es-MX') : item.Fecha,
      Total: item.Total,
      Estatus: item.Estatus || '---',
      FechaPago: item.FechaPagoDate ? item.FechaPagoDate.toLocaleDateString('es-MX') : item.FechaPago || 'Pendiente',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historico');
    XLSX.writeFile(workbook, 'historico-creditos.xlsx');
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
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private applyFilters(): void {
    if (!this.historico.length) {
      this.filteredHistorico = [];
      this.totalHistorico = 0;
      return;
    }

    const term = this.searchTerm.trim().toLowerCase();
    this.filteredHistorico = term
      ? this.historico.filter((record) => this.matchesTerm(record, term))
      : [...this.historico];
    this.totalHistorico = this.filteredHistorico.reduce((acc, item) => acc + (Number(item.Total) || 0), 0);
  }

  private matchesTerm(record: HistoricoTicketView, term: string): boolean {
    const folio = record.FolioInterno?.toLowerCase() ?? '';
    const cliente = record.Cliente?.toLowerCase() ?? '';
    const estatus = record.Estatus?.toLowerCase() ?? '';
    return folio.includes(term) || cliente.includes(term) || estatus.includes(term);
  }
}
