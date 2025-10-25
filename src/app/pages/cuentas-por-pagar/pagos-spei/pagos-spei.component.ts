import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NbToastrService } from '@nebular/theme';

interface PagoPendiente {
  id: number;
  proveedorId: number;
  nombreProveedor: string;
  numeroNota: string;
  factura: string;
  totalFactura: number; // Importe
  nc: number; // Nota de crédito
  descuento: number; // MontoDescuento
  retencion: number; // MontoRetencion
  cartaFaltante: number; // CartaFaltante
  total: number; // TotalPagar
  fechaEntrada: string; // ISO date
  fechaVence: string; // ISO date
}

interface ApiRemisionItem {
  Id: number;
  Estatus: number;
  IdProveedor: number;
  Factura: string;
  Importe: number;
  TotalPagar: number;
  Cheque: any;
  NombreProveedor: string;
  NumeroNota: string;
  FechaEntrada: string;
  FechaVence: string;
  NC: number;
  MontoDescuento: number;
  IdNota: number;
  Retencion: number;
  Iva: number;
  Ieps: number;
  CartaFaltante: number;
  MontoRetencion: number;
  MontoRetencionIva: number;
}

interface ApiRemisionesResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response: { data: ApiRemisionItem[] };
}

interface NotaCargo {
  id: number; // consecutivo en UI
  proveedor: string;
  sucursal: string;
  remision: string;
  subtotal: number;
  ieps: number;
  iva: number;
  total: number;
  fecha: string; // YYYY-MM-DD
}

@Component({
  selector: 'ngx-pagos-spei',
  templateUrl: './pagos-spei.component.html',
  styleUrls: ['./pagos-spei.component.scss'],
})
export class PagosSpeiComponent {
  form: FormGroup;

  proveedores = [
    { id: 99, nombre: 'DECASA DEL CENTRO, S.A. DE C.V.' },
    { id: 12, nombre: 'Proveedor Demo, S.A. de C.V.' },
    { id: 303, nombre: 'SIGMA ALIMENTOS COMERCIAL, S.A. DE C.V.' },
  ];

  sucursales: Array<{ id: number; nombre: string }> = [];

  pendientes: PagoPendiente[] = [];

  selection: Record<number, boolean> = {};
  allSelected = false;

  // Paginación / Ordenamiento
  page = 1;
  pageSize = 10;
  readonly pageSizes = [10, 25, 50, 100, -1]; // -1 = Todos
  sortColumn: keyof PagoPendiente | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Notas de cargo (diseño y paginación independiente)
  notasCargo: NotaCargo[] = [];
  pageNC = 1;
  pageSizeNC = 10;

  constructor(private fb: FormBuilder, private http: HttpClient, private toastr: NbToastrService) {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Inicializa sucursales desde el usuario autenticado (si existe)
    let idSucursalDefault = 1;
    let nombreSucursalDefault = 'Matriz';
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        idSucursalDefault = Number(u?.IdSucursal) || 1;
        nombreSucursalDefault = String(u?.NombreSucursal || 'Matriz');
      }
    } catch {}
    this.sucursales = [{ id: idSucursalDefault, nombre: nombreSucursalDefault }];

    this.form = this.fb.group({
      fechaInicio: [firstOfMonth],
      fechaFin: [endOfMonth],
      fechaPago: [now],
      sucursal: [idSucursalDefault],
      proveedor: [this.proveedores[0].id],
      formaPago: ['SPEI'],
      total: [{ value: 0, disabled: true }],
    });
  }

  buscar(): void {
    const { fechaInicio, fechaFin, proveedor, sucursal } = this.form.getRawValue();
    const body = {
      IdSucursal: String(sucursal ?? '1'),
      IdProveedor: String(proveedor ?? ''),
      FechaInicial: this.formatDate(fechaInicio) ?? '',
      FechaFinal: this.formatDate(fechaFin) ?? '',
    };

    this.http
      .post<ApiRemisionesResponse>(
        `${environment.apiBase}/GetRemisionesPendientesAutomaticos`,
        body,
      )
      .subscribe((res) => {
        const items = res?.response?.data ?? [];
        this.pendientes = items.map((d) => ({
          id: d.Id,
          proveedorId: d.IdProveedor,
          nombreProveedor: d.NombreProveedor,
          numeroNota: d.NumeroNota,
          factura: d.Factura,
          totalFactura: d.Importe,
          nc: d.NC,
          descuento: d.MontoDescuento,
          retencion: d.MontoRetencion,
          cartaFaltante: d.CartaFaltante,
          total: d.TotalPagar,
          fechaEntrada: this.toShortDate(d.FechaEntrada),
          fechaVence: this.toShortDate(d.FechaVence),
        }));
        this.selection = {};
        this.allSelected = false;
        this.page = 1;
        this.recalculateTotal();
        // Después de cargar pendientes, también cargamos las notas de cargo del proveedor seleccionado
        this.buscarNotasCargo();
      });
  }

  private formatDate(value: any): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private formatYYMMDD(value: any): string {
    const d = value instanceof Date ? value : new Date(value);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  private toShortDate(value: string): string {
    if (!value) return '';
    // Handle strings like "2024-11-14 12:00:00 a. m." -> take date part
    const onlyDate = value.split(' ')[0];
    // normalize to YYYY-MM-DD if it's like YYYY-MM-DD already; else try to parse
    if (/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) return onlyDate;
    const d = new Date(value);
    return this.formatDate(d) ?? '';
  }

  private fromDDMMYYYY(dateStr: string): string {
    if (!dateStr) return '';
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return dateStr;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  buscarNotasCargo(): void {
    const { proveedor, sucursal } = this.form.getRawValue();
    const body = {
      IdSucursal: String(sucursal ?? '1'),
      IdProveedor: String(proveedor ?? ''),
      pagos: '1',
    };

    this.http
      .post<any>(`${environment.apiBase}/GetNotasCreditoProveedor`, body)
      .subscribe((res) => {
        const items: any[] = res?.response?.data ?? [];
        this.notasCargo = items.map((i, idx) => ({
          id: Number(i.Id) || idx + 1,
          proveedor: i.NombreProveedor,
          sucursal: i.NombreSucursal,
          remision: String(i.IdRemision || ''),
          subtotal: Number(i.Subtotal) || 0,
          ieps: Number(i.Ieps) || 0,
          iva: Number(i.Iva) || 0,
          total: Number(i.Total) || 0,
          fecha: this.fromDDMMYYYY(i.Fecha),
        }));
      });
  }

  generarPagos(): void {
    const selected = this.pendientes.filter(r => !!this.selection[r.id]);
    if (selected.length === 0 && this.notasCargo.length === 0) {
      this.toastr.warning('No hay facturas seleccionadas ni notas de cargo.', 'Generar pagos');
      return;
    }

    // Datos de usuario/sucursal desde localStorage (AuthService los guarda)
    let userId = 0;
    let idSucursal = 1;
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        userId = Number(u?.Id) || 0;
        idSucursal = Number(u?.IdSucursal) || 1;
      }
    } catch {}

    const { fechaPago, sucursal } = this.form.getRawValue();
    const fechaPagoStr = this.formatDate(fechaPago) || this.formatDate(new Date());
    const prefijo = `${sucursal ?? 1}${this.formatYYMMDD(fechaPago)}`;
    const payload = {
      IdSucursal: Number(sucursal ?? idSucursal),
      IdUsuario: String(userId || '5000'),
      Prefijo: prefijo,
      FechaPago: fechaPagoStr,
      facturas: selected.map(r => ({
        IdRemision: String(r.id),
        IdProveedor: String(r.proveedorId),
        Monto: String(r.total),
        Tipo: '1',
      })),
      notas: this.notasCargo.map(n => ({
        IdNota: String(n.id),
        IdProveedor: String(selected[0]?.proveedorId || ''),
        Total: Number(n.total) || 0,
      })),
    };

    this.http.post<any>(`${environment.apiBase}/GenerarPagosSpei`, payload)
      .subscribe({
        next: (res) => {
          const ok = res?.success ?? res?.Success ?? true;
          this.toastr.success('Pagos generados correctamente', 'Generar pagos');
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al generar pagos';
          this.toastr.danger(msg, 'Generar pagos');
        },
      });
  }

  // Ordenamiento / Paginación / Totales
  setSort(column: keyof PagoPendiente): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  private compare(a: any, b: any): number {
    // Manejo de fechas y números
    const numA = typeof a === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a) ? Date.parse(a) : a;
    const numB = typeof b === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b) ? Date.parse(b) : b;
    if (numA == null && numB == null) return 0;
    if (numA == null) return -1;
    if (numB == null) return 1;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }

  get sortedRows(): PagoPendiente[] {
    const rows = [...this.pendientes];
    if (!this.sortColumn) return rows;
    return rows.sort((r1, r2) => {
      const res = this.compare(r1[this.sortColumn], r2[this.sortColumn]);
      return this.sortDirection === 'asc' ? res : -res;
    });
  }

  get totalPages(): number {
    if (this.pageSize === -1) return 1;
    return Math.max(1, Math.ceil(this.sortedRows.length / this.pageSize));
  }

  get pageRows(): PagoPendiente[] {
    const rows = this.sortedRows;
    if (this.pageSize === -1) return rows;
    const start = (this.page - 1) * this.pageSize;
    return rows.slice(start, start + this.pageSize);
  }

  get totalCount(): number {
    return this.sortedRows.length;
  }

  get displayedCount(): number {
    return this.pageSize === -1 ? this.totalCount : this.pageRows.length;
  }

  // Paginación para Notas de Cargo
  get totalCountNC(): number {
    return this.notasCargo.length;
  }
  get totalPagesNC(): number {
    if (this.pageSizeNC === -1) return 1;
    return Math.max(1, Math.ceil(this.notasCargo.length / this.pageSizeNC));
  }
  get pageRowsNC(): NotaCargo[] {
    if (this.pageSizeNC === -1) return this.notasCargo;
    const start = (this.pageNC - 1) * this.pageSizeNC;
    return this.notasCargo.slice(start, start + this.pageSizeNC);
  }
  setPageSizeNC(size: number): void {
    this.pageSizeNC = Number(size);
    this.pageNC = 1;
  }
  gotoPageNC(p: number): void {
    const max = this.totalPagesNC;
    this.pageNC = Math.min(Math.max(1, p), max);
  }

  get startIndexNC(): number {
    if (this.totalCountNC === 0) return 0;
    return this.pageSizeNC === -1 ? 1 : (this.pageNC - 1) * this.pageSizeNC + 1;
  }
  get endIndexNC(): number {
    if (this.totalCountNC === 0) return 0;
    if (this.pageSizeNC === -1) return this.totalCountNC;
    return Math.min(this.pageNC * this.pageSizeNC, this.totalCountNC);
  }

  // Totales panel
  private sumSelected(mapper: (r: PagoPendiente) => number): number {
    return this.pendientes
      .filter(r => !!this.selection[r.id])
      .reduce((acc, r) => acc + (Number(mapper(r)) || 0), 0);
  }

  get totalSubTotalXPagar(): number {
    return this.sumSelected(r => r.totalFactura);
  }
  get totalNotas(): number {
    return this.notasCargo.reduce((acc, n) => acc + (Number(n.total) || 0), 0);
  }
  get totalNotasPorAplicar(): number {
    return 0; // pendiente de integrar si aplica
  }
  get totalDescuento(): number {
    // suma de descuentos aplicables; por ahora NC + Descuento + Retención + Carta Faltante
    return (
      this.sumSelected(r => r.nc) +
      this.sumSelected(r => r.descuento) +
      this.sumSelected(r => r.retencion) +
      this.sumSelected(r => r.cartaFaltante)
    );
  }
  get totalAPagar(): number {
    // Total final considerando selección y notas
    return this.sumSelected(r => r.total) + this.totalNotas - this.totalNotasPorAplicar;
  }

  setPageSize(size: number): void {
    this.pageSize = Number(size);
    this.page = 1;
  }

  gotoPage(p: number): void {
    const max = this.totalPages;
    this.page = Math.min(Math.max(1, p), max);
  }

  onToggle(id: number, checked: boolean): void {
    this.selection[id] = checked;
    this.allSelected = this.pendientes.length > 0 && this.pendientes.every(r => !!this.selection[r.id]);
    this.recalculateTotal();
  }

  toggleAll(checked: boolean): void {
    this.allSelected = checked;
    for (const r of this.pendientes) {
      this.selection[r.id] = checked;
    }
    this.recalculateTotal();
  }

  private recalculateTotal(): void {
    const sum = this.pendientes
      .filter(r => !!this.selection[r.id])
      .reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    this.form.controls.total.setValue(sum);
  }
}
