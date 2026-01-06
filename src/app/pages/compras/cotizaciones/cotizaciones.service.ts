import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ProveedorDto {
  Id: number;
  nombre: string;
}

interface ProveedoresApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: ProveedorDto[];
  };
}

export interface InsertCotizacionPayload {
  IdSucursal: string;
  IdProveedor: string;
  IdUsuario: string;
}

interface InsertCotizacionApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: number;
  };
}

export interface DetalleCotizacionItem {
  Id: number;
  IdCotizacion: number;
  Codigo: string;
  Descripcion: string;
  Cantidad: number;
  CantidadSinCargo: number;
  CantidadTotal: number;
  Costo: number;
  CostoConDescuento: number;
  Total: number;
  PorcentajeDescuento: string;
}

export interface InsertDetalleCotizacionPayload {
  IdCotizacion: string;
  Codigo: string;
  Cantidad: string;
  Costo: string;
}

interface DetalleCotizacionApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: DetalleCotizacionItem[];
  };
}

interface FinalizarCotizacionPayload {
  IdCotizacion: string;
  Estatus: string;
  Usuario: string;
}

interface FinalizarCotizacionApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: boolean;
  };
}

export interface CotizacionResumen {
  Id: number;
  IdSucursal: number;
  IdProveedor: number;
  IdUsuario: number;
  Proveedor: string;
  Comprador: string;
  Fecha: string;
  FechaEstimada: string;
  NombreEstatus: string;
  DiasRetraso: number;
  Estatus: number;
}

interface CotizacionesApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: CotizacionResumen[];
  };
}

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private readonly proveedoresEndpoint = '/api/GetProveedores';
  private readonly detalleEndpoint = '/api/GetDetalleCotizacion';
  private readonly insertarDetalleEndpoint = '/api/InsertarDetalleCotizacion';
  private readonly finalizarEndpoint = '/api/FinalizarCotizacion';
  private readonly cotizacionesEndpoint = '/api/GetCotizaciones';

  constructor(private readonly http: HttpClient) {}

  obtenerProveedores(): Observable<ProveedorDto[]> {
    return this.http.post<ProveedoresApiResponse>(this.proveedoresEndpoint, {}).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetProveedores error', error);
        return throwError(() => new Error('No se pudieron cargar los proveedores.'));
      }),
    );
  }

  insertarCotizacion(payload: InsertCotizacionPayload): Observable<number> {
    return this.http.post<InsertCotizacionApiResponse>('/api/InsertCotizacion', payload).pipe(
      map((res) => res.response?.data ?? 0),
      catchError((error) => {
        console.error('InsertCotizacion error', error);
        return throwError(() => new Error('No se pudo guardar la cotización.'));
      }),
    );
  }

  insertarDetalleCotizacion(payload: InsertDetalleCotizacionPayload): Observable<boolean> {
    return this.http.post<DetalleCotizacionApiResponse>(this.insertarDetalleEndpoint, payload).pipe(
      map((res) => Boolean(res?.success)),
      catchError((error) => {
        console.error('InsertarDetalleCotizacion error', error);
        return throwError(() => new Error('No se pudo agregar el detalle.'));
      }),
    );
  }

  obtenerDetalleCotizacion(idCotizacion: string): Observable<DetalleCotizacionItem[]> {
    return this.http.post<DetalleCotizacionApiResponse>(this.detalleEndpoint, { IdCotizacion: idCotizacion }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetDetalleCotizacion error', error);
        return throwError(() => new Error('No se pudo obtener el detalle de la cotización.'));
      }),
    );
  }

  obtenerCotizaciones(proveedorId: string): Observable<CotizacionResumen[]> {
    const params = new HttpParams().set('proveedor', proveedorId);
    return this.http.get<CotizacionesApiResponse>(this.cotizacionesEndpoint, { params }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetCotizaciones error', error);
        return throwError(() => new Error('No se pudieron obtener las cotizaciones.'));
      }),
    );
  }

  finalizarCotizacion(payload: FinalizarCotizacionPayload): Observable<boolean> {
    return this.http.post<FinalizarCotizacionApiResponse>(this.finalizarEndpoint, payload).pipe(
      map((res) => Boolean(res.response?.data)),
      catchError((error) => {
        console.error('FinalizarCotizacion error', error);
        return throwError(() => new Error('No se pudo finalizar la cotización.'));
      }),
    );
  }
}
