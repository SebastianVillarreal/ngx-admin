import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

export interface TipoMovimientoResponseItem {
  Id: number;
  Nombre: string;
  Clave: string;
  NombreTipo: string | null;
  Tipo: number;
  NombreEstatus: string | null;
}

interface TipoMovimientosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: TipoMovimientoResponseItem[];
  };
}

interface InsertMovimientoRecord {
  Id: number;
  Folio?: number;
}

interface InsertMovimientoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: InsertMovimientoRecord[];
  };
}

export interface InsertMovimientoPayload {
  IdSucursal: number;
  TipoMovimiento: string;
  UsuarioEntrega: number;
  ClaveProveedor: number;
  Referencia: string;
  Nota: string;
}

export interface InsertMovimientoResult {
  id: number;
  folio: number;
}

export interface InsertRenglonMovimientoPayload {
  IdSucursal: string;
  Folio: string;
  Tipo: string;
  Articulo: string;
  Precio: string;
  Cantidad: string;
  IdMovimiento: string;
}

interface InsertRenglonMovimientoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Array<Record<string, unknown>>;
  };
}

export interface AutocompleteArticuloOption {
  value: string;
  label: string;
}

interface AutocompleteArticulosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: AutocompleteArticuloOption[];
  };
}

export interface ExistenciaArticulo {
  Codigo: string;
  Descripcion: string;
  UMedida: string;
  Existencia: number;
  Costo: number;
}

interface ExistenciaArticuloApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: ExistenciaArticulo;
  };
}

export interface GetRenglonesMovimientoPayload {
  Folio: string;
  Tipo: string;
  IdSucursal: string;
  Historico: string;
}

export interface RenglonMovimiento {
  Id: number;
  Articulo: string;
  Descripcion: string;
  Cantidad: number;
}

interface RenglonesMovimientoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: RenglonMovimiento[];
  };
}

@Injectable({ providedIn: 'root' })
export class InventariosService {
  private readonly tipoMovimientosEndpoint = `${environment.apiBase}/GetTipoMovimientos`;
  private readonly insertMovimientoEndpoint = `${environment.apiBase}/InsertMovimiento`;
  private readonly insertRenglonMovimientoEndpoint = `${environment.apiBase}/InsertRenglonMovimiento`;
  private readonly autocompleteArticulosEndpoint = `${environment.apiBase}/AutocompleteArticulos`;
  private readonly existenciaArticuloEndpoint = `${environment.apiBase}/GetExistencia`;
  private readonly renglonesMovimientoEndpoint = `${environment.apiBase}/GetRenglonesMovimiento`;

  constructor(private readonly http: HttpClient) {}

  fetchTipoMovimientos(tipoMovimiento: string): Observable<TipoMovimientoResponseItem[]> {
    const payload = { TipoMovimiento: tipoMovimiento };
    return this.http.post<TipoMovimientosApiResponse>(this.tipoMovimientosEndpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetTipoMovimientos error', error);
        return throwError(() => new Error('No se pudieron obtener los tipos de movimiento.'));
      }),
    );
  }

  insertMovimiento(payload: InsertMovimientoPayload): Observable<InsertMovimientoResult> {
    return this.http.post<InsertMovimientoApiResponse>(this.insertMovimientoEndpoint, payload).pipe(
      map((res) => {
        const record = res.response?.data?.[0];
        return {
          id: record?.Id ?? 0,
          folio: record?.Folio ?? 0,
        };
      }),
      catchError((error) => {
        console.error('InsertMovimiento error', error);
        return throwError(() => new Error('No se pudo registrar el movimiento.'));
      }),
    );
  }

  insertRenglonMovimiento(payload: InsertRenglonMovimientoPayload): Observable<Record<string, unknown> | null> {
    return this.http.post<InsertRenglonMovimientoApiResponse>(this.insertRenglonMovimientoEndpoint, payload).pipe(
      map((res) => res.response?.data?.[0] ?? null),
      catchError((error) => {
        console.error('InsertRenglonMovimiento error', error);
        return throwError(() => new Error('No se pudo registrar el detalle del movimiento.'));
      }),
    );
  }

  autocompleteArticulos(term: string, top = 15): Observable<AutocompleteArticuloOption[]> {
    const params = new HttpParams().set('term', term).set('top', String(top));
    return this.http.get<AutocompleteArticulosApiResponse>(this.autocompleteArticulosEndpoint, { params }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('AutocompleteArticulos error', error);
        return throwError(() => new Error('No se pudo buscar artículos.'));
      }),
    );
  }

  obtenerExistenciaArticulo(articulo: string, idSucursal: string): Observable<ExistenciaArticulo | null> {
    const payload = {
      Articulo: articulo,
      IdSucursal: idSucursal,
    };
    return this.http.post<ExistenciaArticuloApiResponse>(this.existenciaArticuloEndpoint, payload).pipe(
      map((res) => res.response?.data ?? null),
      catchError((error) => {
        console.error('GetExistencia error', error);
        return throwError(() => new Error('No se pudo obtener la información del artículo.'));
      }),
    );
  }

  fetchRenglonesMovimiento(payload: GetRenglonesMovimientoPayload): Observable<RenglonMovimiento[]> {
    return this.http.post<RenglonesMovimientoApiResponse>(this.renglonesMovimientoEndpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetRenglonesMovimiento error', error);
        return throwError(() => new Error('No se pudieron obtener los renglones del movimiento.'));
      }),
    );
  }
}
