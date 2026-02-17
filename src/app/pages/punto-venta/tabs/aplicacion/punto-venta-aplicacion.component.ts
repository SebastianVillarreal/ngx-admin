import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import * as XLSX from 'xlsx';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ArticuloDto, ArticulosService } from '../../../compras/articulos/articulos.service';
import { Cliente, ClientesService } from '../../../cuentas-por-cobrar/clientes/clientes.service';

interface PuntoVentaArticuloRow {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioVenta: number;
  estatus: number;
}

type SortColumn = 'codigo' | 'descripcion' | 'cantidad' | 'precioVenta' | 'importe';

interface InsertarVentaPagoPayload {
  tipo: number;
  monto: number;
  anticipo: number;
  referencia: string;
}

interface InsertarVentaProductoPayload {
  consecutivo: number;
  codigo: string;
  cantidad: number;
  precioVenta: number;
  estatus: number;
}

interface InsertarVentaPayload {
  fecha: string;
  sucursal: number;
  usuario: number;
  folioInterno: string;
  idCliente: number;
  tipo: number;
  caja: number;
  formaPago: string;
  venta: number;
  estatus: number;
  referencia: string;
  idDoctor: number;
  PagoInicial: string;
  Cashback: string;
  pagos: InsertarVentaPagoPayload[];
  productos: InsertarVentaProductoPayload[];
}

interface InsertarVentaResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: {
      Exito: boolean;
      Mensaje: string;
      IdGenerado: number;
      Header?: {
        Id: number;
        IdCliente: number;
        FolioInterno: string;
        FechaHoraVenta: string;
        TotalVenta: number;
        NombreCliente: string;
      };
    };
  };
}

@Component({
  selector: 'ngx-punto-venta-aplicacion',
  templateUrl: './punto-venta-aplicacion.component.html',
  styleUrls: ['./punto-venta-aplicacion.component.scss'],
})
export class PuntoVentaAplicacionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild('clientesDialog', { static: true }) clientesDialog!: TemplateRef<any>;
  ventaForm: FormGroup;
  readonly sessionUsuario: number;
  readonly sessionSucursal: number;
  selectedClienteId = 1;
  selectedClienteNombre = 'Cliente general';

  articuloTerm = '';
  scannerCode = '';
  scannerLoading = false;
  buscandoArticulos = false;
  articulosEncontrados: ArticuloDto[] = [];
  articulosError = '';

  items: PuntoVentaArticuloRow[] = [];
  displayItems: PuntoVentaArticuloRow[] = [];
  paginatedItems: PuntoVentaArticuloRow[] = [];
  searchTerm = '';
  sortColumn: SortColumn = 'descripcion';
  sortDirection: 'asc' | 'desc' = 'asc';
  pageSizeOptions = [10, 25, 50];
  pageSize = 10;
  currentPage = 1;

  procesandoVenta = false;
  ventaError = '';
  ventaExito = '';
  ventaRespuesta: InsertarVentaResponse['response']['data'] | null = null;
  clienteDialogRef: NbDialogRef<any> | null = null;
  clientesLoading = false;
  clientesError = '';
  clientesSearch = '';
  clientesItems: Cliente[] = [];
  paginatedClientesItems: Cliente[] = [];
  clientesPage = 1;
  clientesPageSize = 10;
  readonly clientesPageSizeOptions = [10, 25, 50];

  readonly tiposPago = [
    { value: 1, label: 'Efectivo' },
    { value: 2, label: 'Tarjeta' },
    { value: 3, label: 'Transferencia' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly articulosService: ArticulosService,
    private readonly clientesService: ClientesService,
    private readonly dialogService: NbDialogService,
  ) {
    const authUser = this.getAuthUser();
    this.sessionUsuario = Number(authUser?.IdUsuario || authUser?.Id || 1);
    this.sessionSucursal = Number(authUser?.IdSucursal || 1);

    this.ventaForm = this.fb.group({
      folioInterno: ['', [Validators.required]],
      caja: [1, [Validators.required, Validators.min(1)]],
      tipoPago: [1, [Validators.required]],
      montoPago: [0, [Validators.required, Validators.min(0.01)]],
      referenciaPago: [''],
    });
  }

  ngOnInit(): void {
    this.applyTransforms();
    this.updateFolioPreview();
    this.ventaForm.get('caja')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateFolioPreview());
  }

  openClientesModal(): void {
    this.clientesSearch = '';
    this.clientesPage = 1;
    this.loadClientesForModal('');
    this.clienteDialogRef = this.dialogService.open(this.clientesDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: true,
    });
  }

  closeClientesModal(ref?: NbDialogRef<any>): void {
    (ref || this.clienteDialogRef)?.close();
    this.clienteDialogRef = null;
  }

  buscarClientesModal(): void {
    this.clientesPage = 1;
    this.loadClientesForModal(this.clientesSearch);
  }

  seleccionarCliente(cliente: Cliente, ref?: NbDialogRef<any>): void {
    this.selectedClienteId = Number(cliente?.Id || 1);
    this.selectedClienteNombre = String(cliente?.Nombre || 'Cliente general');
    this.closeClientesModal(ref);
  }

  buscarArticulos(): void {
    const term = this.articuloTerm.trim();
    if (!term) {
      this.articulosEncontrados = [];
      this.articulosError = 'Captura codigo o descripcion para buscar.';
      return;
    }

    this.buscandoArticulos = true;
    this.articulosError = '';
    this.articulosService.getArticulos({ skip: 0, pageSize: 20, search: term }).subscribe({
      next: ({ rows }) => {
        this.articulosEncontrados = rows || [];
        if (!this.articulosEncontrados.length) {
          this.articulosError = 'No se encontraron articulos con el criterio indicado.';
        }
      },
      error: () => {
        this.articulosEncontrados = [];
        this.articulosError = 'No se pudieron consultar articulos.';
      },
      complete: () => {
        this.buscandoArticulos = false;
      },
    });
  }

  agregarArticulo(articulo: ArticuloDto): void {
    const codigo = String(articulo?.Codigo || '').trim();
    if (!codigo) {
      return;
    }

    const idx = this.items.findIndex((x) => x.codigo === codigo);
    if (idx >= 0) {
      this.items[idx].cantidad += 1;
      this.items[idx].estatus = 1;
    } else {
      const precio =
        Number(articulo.PrecioPv)
        || Number(articulo.PrecioFinal)
        || Number(articulo.PrecioFinalImpuestos)
        || Number(articulo.Costo)
        || 0;
      this.items.push({
        codigo,
        descripcion: String(articulo.Descripcion || ''),
        cantidad: 1,
        precioVenta: Number(precio.toFixed(2)),
        estatus: 1,
      });
    }

    this.currentPage = 1;
    this.syncMontoPago();
    this.applyTransforms();
  }

  onScannerEnter(event: Event): void {
    event.preventDefault();
    const code = this.scannerCode.trim();
    if (!code) {
      return;
    }
    this.agregarArticuloPorCodigo(code);
  }

  agregarArticuloPorCodigo(codigo: string): void {
    const code = String(codigo || '').trim();
    if (!code) {
      return;
    }

    this.scannerLoading = true;
    this.articulosError = '';
    this.articulosService.getArticulos({ skip: 0, pageSize: 20, search: code }).subscribe({
      next: ({ rows }) => {
        const data = rows || [];
        const exact = data.find((x) => String(x.Codigo || '').trim().toLowerCase() === code.toLowerCase());
        const selected = exact || data[0];
        if (!selected) {
          this.articulosError = `No se encontro el articulo con codigo ${code}.`;
          return;
        }
        this.agregarArticulo(selected);
        this.scannerCode = '';
      },
      error: () => {
        this.articulosError = 'No se pudo agregar articulo por codigo.';
      },
      complete: () => {
        this.scannerLoading = false;
      },
    });
  }

  quitarArticulo(item: PuntoVentaArticuloRow): void {
    this.items = this.items.filter((x) => x.codigo !== item.codigo);
    this.currentPage = 1;
    this.syncMontoPago();
    this.applyTransforms();
  }

  actualizarCantidad(item: PuntoVentaArticuloRow, value: number): void {
    const qty = Math.max(1, Number(value) || 1);
    item.cantidad = qty;
    this.syncMontoPago();
    this.applyTransforms();
  }

  actualizarPrecio(item: PuntoVentaArticuloRow, value: number): void {
    const precio = Math.max(0.01, Number(value) || 0.01);
    item.precioVenta = Number(precio.toFixed(2));
    this.syncMontoPago();
    this.applyTransforms();
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

  exportToExcel(): void {
    if (!this.displayItems.length) {
      return;
    }

    const rows = this.displayItems.map((item, index) => ({
      Consecutivo: index + 1,
      Codigo: item.codigo,
      Descripcion: item.descripcion,
      Cantidad: item.cantidad,
      PrecioVenta: item.precioVenta,
      Importe: this.getImporte(item),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Carrito');
    XLSX.writeFile(workbook, 'punto-venta-carrito.xlsx');
  }

  trackByArticuloResultado(_: number, item: ArticuloDto): string {
    return String(item.Codigo || '');
  }

  trackByCodigo(_: number, item: PuntoVentaArticuloRow): string {
    return item.codigo;
  }

  trackByClienteId(_: number, item: Cliente): number {
    return Number(item?.Id || 0);
  }

  changeClientesPageSize(size: number): void {
    this.clientesPageSize = Number(size) || 10;
    this.clientesPage = 1;
    this.applyClientesPagination();
  }

  previousClientesPage(): void {
    if (this.clientesPage <= 1) {
      return;
    }
    this.clientesPage -= 1;
    this.applyClientesPagination();
  }

  nextClientesPage(): void {
    if (this.clientesPage >= this.clientesTotalPages) {
      return;
    }
    this.clientesPage += 1;
    this.applyClientesPagination();
  }

  get clientesTotalPages(): number {
    return Math.max(1, Math.ceil(this.clientesItems.length / this.clientesPageSize));
  }

  get clientesRangeStart(): number {
    if (!this.clientesItems.length) {
      return 0;
    }
    return (this.clientesPage - 1) * this.clientesPageSize + 1;
  }

  get clientesRangeEnd(): number {
    if (!this.clientesItems.length) {
      return 0;
    }
    return Math.min(this.clientesPage * this.clientesPageSize, this.clientesItems.length);
  }

  procesarVenta(): void {
    this.ventaError = '';
    this.ventaExito = '';
    this.ventaRespuesta = null;

    if (this.ventaForm.invalid) {
      this.ventaForm.markAllAsTouched();
      this.ventaError = 'Completa los datos requeridos para procesar la venta.';
      return;
    }

    if (!this.items.length) {
      this.ventaError = 'Agrega al menos un articulo al carrito.';
      return;
    }

    const totalVenta = Number(this.totalVenta.toFixed(2));
    const montoPago = Number(this.ventaForm.get('montoPago')?.value || 0);
    if (Math.abs(montoPago - totalVenta) > 0.01) {
      this.ventaError = 'El monto de pago debe ser igual al total de la venta.';
      return;
    }

    const tipoPago = Number(this.ventaForm.get('tipoPago')?.value || 1);
    const folioInterno = this.consumeNextFolio();
    const payload: InsertarVentaPayload = {
      fecha: this.getTodayYYYYMMDD(),
      sucursal: this.sessionSucursal,
      usuario: this.sessionUsuario,
      folioInterno,
      idCliente: this.selectedClienteId || 1,
      tipo: 1,
      caja: Number(this.ventaForm.get('caja')?.value || 1),
      formaPago: this.getTipoPagoLabel(tipoPago),
      venta: totalVenta,
      estatus: 2,
      referencia: '',
      idDoctor: 0,
      PagoInicial: '0',
      Cashback: '0',
      pagos: [
        {
          tipo: tipoPago,
          monto: totalVenta,
          anticipo: 0,
          referencia: String(this.ventaForm.get('referenciaPago')?.value || '').trim(),
        },
      ],
      productos: this.items.map((item, idx) => ({
        consecutivo: idx + 1,
        codigo: item.codigo,
        cantidad: Number(item.cantidad),
        precioVenta: Number(item.precioVenta),
        estatus: 1,
      })),
    };

    this.procesandoVenta = true;
    this.http.post<InsertarVentaResponse>(`${environment.apiBase}/InsertarVenta`, payload).subscribe({
      next: (res) => {
        this.ventaRespuesta = res?.response?.data || null;
        this.ventaExito = this.ventaRespuesta?.Mensaje || res?.message || 'Venta procesada correctamente.';
        this.items = [];
        this.applyTransforms();
        this.ventaForm.patchValue({
          referenciaPago: '',
          montoPago: 0,
        });
        this.updateFolioPreview();
      },
      error: (err) => {
        this.ventaError = err?.error?.message || err?.message || 'No se pudo procesar la venta.';
      },
      complete: () => {
        this.procesandoVenta = false;
      },
    });
  }

  get totalVenta(): number {
    return this.items.reduce((acc, item) => acc + this.getImporte(item), 0);
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

  private applyTransforms(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = term
      ? this.items.filter((item) =>
        item.codigo.toLowerCase().includes(term)
        || item.descripcion.toLowerCase().includes(term),
      )
      : [...this.items];

    this.displayItems = filtered.sort((a, b) => this.compareRows(a, b));
    this.paginate();
  }

  private paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedItems = this.displayItems.slice(start, end);
  }

  private compareRows(a: PuntoVentaArticuloRow, b: PuntoVentaArticuloRow): number {
    const factor = this.sortDirection === 'asc' ? 1 : -1;
    let result = 0;
    switch (this.sortColumn) {
      case 'codigo':
        result = a.codigo.localeCompare(b.codigo, 'es', { sensitivity: 'base' });
        break;
      case 'descripcion':
        result = a.descripcion.localeCompare(b.descripcion, 'es', { sensitivity: 'base' });
        break;
      case 'cantidad':
        result = a.cantidad - b.cantidad;
        break;
      case 'precioVenta':
        result = a.precioVenta - b.precioVenta;
        break;
      case 'importe':
        result = this.getImporte(a) - this.getImporte(b);
        break;
      default:
        result = 0;
        break;
    }
    return result * factor;
  }

  private getImporte(item: PuntoVentaArticuloRow): number {
    return Number((item.cantidad * item.precioVenta).toFixed(2));
  }

  private syncMontoPago(): void {
    this.ventaForm.patchValue({ montoPago: Number(this.totalVenta.toFixed(2)) }, { emitEvent: false });
  }

  private getTodayYYYYMMDD(): string {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private updateFolioPreview(): void {
    this.ventaForm.patchValue({ folioInterno: this.peekNextFolio() }, { emitEvent: false });
  }

  private peekNextFolio(): string {
    const caja = Number(this.ventaForm.get('caja')?.value || 1);
    const datePart = this.getTodayDDMMYYYY();
    const key = this.getFolioCounterKey(caja, datePart);
    const raw = localStorage.getItem(key);
    const current = Number(raw || '0');
    const next = current + 1;
    return `${caja}${datePart}${String(next).padStart(4, '0')}`;
  }

  private consumeNextFolio(): string {
    const caja = Number(this.ventaForm.get('caja')?.value || 1);
    const datePart = this.getTodayDDMMYYYY();
    const key = this.getFolioCounterKey(caja, datePart);
    const raw = localStorage.getItem(key);
    const current = Number(raw || '0');
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return `${caja}${datePart}${String(next).padStart(4, '0')}`;
  }

  private getFolioCounterKey(caja: number, datePart: string): string {
    return `pv_folio_seq_${caja}_${datePart}`;
  }

  private getTodayDDMMYYYY(): string {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear());
    return `${d}${m}${y}`;
  }

  private getTipoPagoLabel(tipo: number): string {
    const found = this.tiposPago.find((x) => x.value === tipo);
    return found?.label?.toUpperCase() || 'EFECTIVO';
  }

  private getAuthUser(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private loadClientesForModal(nombreCliente: string): void {
    this.clientesLoading = true;
    this.clientesError = '';
    this.clientesItems = [];
    this.paginatedClientesItems = [];
    this.clientesService.fetchClientes((nombreCliente || '').trim()).subscribe({
      next: (items) => {
        this.clientesItems = items || [];
        this.applyClientesPagination();
      },
      error: (err) => {
        this.clientesError = err?.message || 'No se pudo obtener la informacion de clientes.';
      },
      complete: () => {
        this.clientesLoading = false;
      },
    });
  }

  private applyClientesPagination(): void {
    const total = this.clientesItems.length;
    if (!total) {
      this.clientesPage = 1;
      this.paginatedClientesItems = [];
      return;
    }

    if (this.clientesPage > this.clientesTotalPages) {
      this.clientesPage = this.clientesTotalPages;
    }

    const start = (this.clientesPage - 1) * this.clientesPageSize;
    const end = start + this.clientesPageSize;
    this.paginatedClientesItems = this.clientesItems.slice(start, end);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
