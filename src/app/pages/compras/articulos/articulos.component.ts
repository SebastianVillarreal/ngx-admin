import { Component, OnDestroy, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { Subscription } from 'rxjs';

import { ArticuloDto, ArticulosService } from './articulos.service';
import { ArticuloToggleCellComponent, ArticuloToggleEvent } from './articulo-toggle-cell.component';

interface ArticuloRow {
  codigo: string;
  descripcion: string;
  departamento: string;
  familia: string;
  ultimoCosto: string;
  precioPv: string;
  precioOferta: string;
  iva: number;
  ieps: number;
  claveSat: string;
  inventariable: boolean;
  estatus: boolean;
  piso: boolean;
}

@Component({
  selector: 'ngx-articulos',
  styleUrls: ['./articulos.component.scss'],
  templateUrl: './articulos.component.html',
})
export class ArticulosComponent implements OnInit, OnDestroy {
  codigoBusqueda = '';
  pageSize = 10;
  quickSearch = '';
  totalCount = 0;
  toggleMessage = '';
  private page = 1;
  private sourceSub?: Subscription;
  private togglePendingByCodigo = new Set<string>();
  articulosFull: ArticuloDto[] = [];

  settings = {
    actions: {
      add: false,
      delete: false,
      position: 'right',
      edit: true,
      columnTitle: 'Editar',
    },
    edit: {
      editButtonContent: 'Editar',
      saveButtonContent: 'Guardar',
      cancelButtonContent: 'Cancelar',
      confirmSave: false,
    },
    pager: {
      display: true,
      perPage: this.pageSize,
    },
    hideSubHeader: true,
    columns: {
      codigo: { title: 'Codigo', type: 'string', width: '140px' },
      descripcion: { title: 'Descripcion', type: 'string' },
      departamento: { title: 'Departamento', type: 'string' },
      familia: { title: 'Familia', type: 'string' },
      ultimoCosto: { title: 'Ultimo Costo', type: 'string' },
      precioPv: { title: 'Precio Pv', type: 'string' },
      precioOferta: { title: 'Precio Oferta', type: 'string' },
      iva: { title: 'Iva', type: 'number', width: '60px' },
      ieps: { title: 'Ieps', type: 'number', width: '60px' },
      claveSat: { title: 'Clave Sat', type: 'string' },
      inventariable: {
        title: 'Inventariable',
        type: 'custom',
        renderComponent: ArticuloToggleCellComponent,
        onComponentInitFunction: (instance: ArticuloToggleCellComponent) => {
          instance.field = 'inventariable';
          instance.onToggle = (event) => this.handleToggle(event);
        },
        width: '120px',
      },
      estatus: {
        title: 'Estatus',
        type: 'custom',
        renderComponent: ArticuloToggleCellComponent,
        onComponentInitFunction: (instance: ArticuloToggleCellComponent) => {
          instance.field = 'estatus';
          instance.onToggle = (event) => this.handleToggle(event);
        },
        width: '90px',
      },
      piso: {
        title: 'Piso',
        type: 'html',
        valuePrepareFunction: (value: boolean) => value ? 'OK' : '',
        width: '80px',
      },
    },
  } as any;

  source = new LocalDataSource();

  constructor(private articulosSvc: ArticulosService) {}

  ngOnInit(): void {
    this.loadArticulos(0, this.pageSize, this.getSearchTerm());

    this.sourceSub = this.source.onChanged().subscribe((change: any) => {
      if (change && change.action === 'page' && change.paging) {
        this.page = change.paging.page || 1;
        const skip = (this.page - 1) * this.pageSize;
        this.loadArticulos(skip, this.pageSize, this.getSearchTerm());
      }
    });
  }

  ngOnDestroy(): void {
    this.sourceSub?.unsubscribe();
  }

  onBuscar(): void {
    this.page = 1;
    this.loadArticulos(0, this.pageSize, this.codigoBusqueda?.trim() || '');
  }

  onQuickSearch(text: string): void {
    this.quickSearch = text;
    this.page = 1;
    this.loadArticulos(0, this.pageSize, this.getSearchTerm());
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    (this.settings as any).pager = { display: true, perPage: size };
    this.settings = { ...(this.settings as any) };
    this.page = 1;
    this.loadArticulos(0, this.pageSize, this.getSearchTerm());
  }

  private getSearchTerm(): string {
    return (this.codigoBusqueda?.trim() || this.quickSearch?.trim() || '');
  }

  private loadArticulos(skip: number, pageSize: number, search: string): void {
    this.articulosSvc.getArticulos({ skip, pageSize, search }).subscribe(({ rows, total }) => {
      this.totalCount = total || 0;
      this.articulosFull = rows;
      this.loadCurrentRowsToTable();
    });
  }

  private handleToggle(event: ArticuloToggleEvent): void {
    const codigo = String(event?.rowData?.codigo || '').trim();
    if (!codigo) {
      return;
    }

    const dto = this.articulosFull.find((item) => (item.Codigo || '').trim() === codigo);
    if (!dto) {
      return;
    }

    if (this.togglePendingByCodigo.has(codigo)) {
      this.loadCurrentRowsToTable();
      return;
    }

    const prevInventariable = (dto.Inventariable || 0) === 1;
    const prevEstatus = (dto.Estatus || 0) === 1;
    const nextInventariable = event.field === 'inventariable' ? event.checked : prevInventariable;
    const nextEstatus = event.field === 'estatus' ? event.checked : prevEstatus;

    this.toggleMessage = '';
    this.togglePendingByCodigo.add(codigo);

    this.articulosSvc.activarArticulo({
      Codigo: codigo,
      Estatus: nextEstatus ? '1' : '0',
      Inventariable: nextInventariable ? '1' : '0',
      Usuario: '1',
    }).subscribe((ok) => {
      this.togglePendingByCodigo.delete(codigo);

      if (!ok) {
        this.toggleMessage = `No se pudo actualizar el articulo ${codigo}.`;
        this.loadCurrentRowsToTable();
        return;
      }

      dto.Inventariable = nextInventariable ? 1 : 0;
      dto.Estatus = nextEstatus ? 1 : 0;
      this.toggleMessage = '';
      this.loadCurrentRowsToTable();
    });
  }

  private loadCurrentRowsToTable(): void {
    const tableRows: ArticuloRow[] = this.articulosFull.map((row) => this.mapToTableRow(row));
    this.source.load(tableRows);
  }

  private mapToTableRow(dto: ArticuloDto): ArticuloRow {
    return {
      codigo: (dto.Codigo || '').trim(),
      descripcion: dto.Descripcion || '',
      departamento: dto.NombreDepartamento || '',
      familia: dto.NombreFamilia || '',
      ultimoCosto: this.formatCurrency(dto.CostoEstandar),
      precioPv: this.formatCurrency(dto.PrecioPv),
      precioOferta: this.formatCurrency(dto.PrecioOferta),
      iva: Number(dto.Iva || 0),
      ieps: Number(dto.Ieps || 0),
      claveSat: dto.ClaveSat || '',
      inventariable: (dto.Inventariable || 0) === 1,
      estatus: (dto.Estatus || 0) === 1,
      piso: false,
    };
  }

  private formatCurrency(value: number | null | undefined): string {
    const safeValue = typeof value === 'number' ? value : 0;
    return `$${safeValue.toFixed(2)}`;
  }
}
